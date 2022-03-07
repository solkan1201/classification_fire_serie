var params = {
    asset_output: 'users/SarahMoura/Doutorado/Dados/ImgBase/',
    //asset_output: 'users/CartasSol/temporal/',
    asset_input: 'users/SarahMoura/Doutorado/Dados/SerieLandsat',
    bnd_int: ['red', 'nir', 'swir1', 'swir2'],
    vis: {
        bands: ["swir1","nir","red"],
        gamma: 1,
        max: 3723,
        min: 153,
        opacity: 1
    }

}

var export_original = true;

var  Index_Normalized_Burn = function(img){
    var nbrImg = img.expression(
        "float((b('nir') - b('swir2')) / (b('nir') + b('swir2')))").rename(['nbr']);   
    
    var baiImg = img.expression(
        "float(1/ ((0.05 - b('nir'))**2 + (0.2 - b('swir2'))**2))").rename(['baiml']); 
    
    var birmiImg = img.expression(
        "loat((10 * b('swir1')) - (9.8 * b('swir2')) + 2)").rename(['birmi']); 
    
    
    return img.addBands(nbrImg).addBands(baiImg).addBands(birmiImg);
}


var borderRemove = function (image){
    
    var polygon = image.geometry();

    return image.clip(
        polygon.buffer(-30000.0)
    );
};

var funct_export_Img = function(imagem, name_im, geom){
    
    var asset_path = params.asset_output + name_im
    var ptro_exp = {
        image: imagem, 
        description: name_im,  
        assetId: asset_path, 
        pyramidingPolicy: {".default": 'mode'},
        region: geom,
        scale: 30,
        maxPixels: 1e11               
    }

    Export.image.toAsset(ptro_exp)
}

var cloudMaskL457 = function(image) {
    
    var qa = ee.Image(image.select('pixel_qa'));
    // If the cloud bit (5) is set and the cloud confidence (7) is high
    // or the cloud shadow bit is set (3), then it's a bad pixel.
    var cloud = qa.bitwiseAnd(1 << 5)
                    .and(qa.bitwiseAnd(1 << 7))
                    .or(qa.bitwiseAnd(1 << 3));
    // Remove edge pixels that don't occur in all bands
    var mask2 = ee.Image(image).mask().reduce(ee.Reducer.min());
    cloud = cloud.focalMin(7)
    return borderRemove(ee.Image(image).updateMask(cloud.not()).updateMask(mask2));

};

function maskL8sr(image) {
    // Bits 3 and 5 are cloud shadow and cloud, respectively.
    var cloudShadowBitMask = (1 << 3);
    var cloudsBitMask = (1 << 5);
    // Get the pixel QA band.
    var qa = image.select('pixel_qa');
    // Both flags should be set to zero, indicating clear conditions.
    var mask = qa.bitwiseAnd(1 << 3).eq(0)
                    .and(qa.bitwiseAnd(1 << 5).eq(0));
    mask = mask.focalMin(7)
    return borderRemove(image.updateMask(mask));
}

var get_landsatCollection = function (img){
  
    var id_l = img.id();
    // print("id da image ", id_l)
    var strId = ee.String(id_l).slice(0, -7);

    var patronl8 = strId.index('LC08');
    var patronl7 = strId.index('LE07');
    
    var bands_L57 = ["B1","B3","B4","B5","B7",'pixel_qa'];
    var bands_L8 = ["B2","B4","B5","B6","B7",'pixel_qa'];
    var bnds_name = ["blue","red","nir","swir1","swir2",'pixel_qa'];            
    var img_new =  ee.Algorithms.If(
                          ee.Algorithms.IsEqual(patronl8, -1),
                          ee.Algorithms.If(
                                ee.Algorithms.IsEqual(patronl7, -1),
                                cloudMaskL457(ee.ImageCollection('LANDSAT/LT05/C01/T1_SR').filter(
                                                  ee.Filter.eq('system:index', strId)
                                                  ).first().select(bands_L57, bnds_name)),
                                cloudMaskL457(ee.ImageCollection('LANDSAT/LE07/C01/T1_SR').filter(
                                                  ee.Filter.eq('system:index', strId)
                                                  ).first().select(bands_L57, bnds_name))
                            ),
                            maskL8sr(ee.ImageCollection('LANDSAT/LC08/C01/T1_SR').filter(
                                        ee.Filter.eq('system:index', strId)
                                        ).first().select(bands_L8, bnds_name))
                    );
    

    return img_new;
};

var imgCol = ee.ImageCollection(params.asset_input).sort('system:time_start');
var tam = imgCol.size();//getInfo();
var raizTam = ee.Number(tam).sqrt();
if (export_original === true){
    print("mudou ")
    var serie_landsat = imgCol.map(get_landsatCollection);
    // var teste = get_landsatCollection(serie_landsat_Col.first())
    // print(teste)
}else{
    var serie_landsat = imgCol;
}


serie_landsat = serie_landsat.map(Index_Normalized_Burn);
print(serie_landsat)

var media_NBR = serie_landsat.select('nbr').mean();
var media_BAI = serie_landsat.select('baiml').mean();
var media_MIRBI = serie_landsat.select('mirbi').mean();
//a media do tempo para o dado é  82.5 
// ls_tempo = [kk for kk in range(1, tam + 1)]
// media_time = np.mean(ls_tempo)
var media_time = 82.5;


var geome = serie_landsat.geometry();
if (export_original === true){
    var  name_img = 'images_real_medianNBR_portugal_fire'
    funct_export_Img(media_NBR, name_img, geome);
    name_img = 'images_real_medianBAIML_portugal_fire'
    funct_export_Img(media_BAI, name_img, geome);
    name_img = 'images_real_medianMIRBI_portugal_fire'
    funct_export_Img(media_MIRBI, name_img, geome);
}else{
    var  name_img = 'imagesN_medianNBR_portugal_fire'
    funct_export_Img(media_NBR, name_img, geome);
    name_img = 'imagesN_medianBAIML_portugal_fire'
    funct_export_Img(media_BAI, name_img, geome);
    name_img = 'imagesN_medianMIRBI_portugal_fire'
    funct_export_Img(media_MIRBI, name_img, geome);

}
//intervalo = 0.1 * myDF[indice].std() 
//media = myDF[indice].mean()
//intervalo = intervalo / media_time
var desvioNBR = serie_landsat.select('nbr').reduce(ee.Reducer.stdDev());
var desvioBAI = serie_landsat.select('baiml').reduce(ee.Reducer.stdDev());

var intervaloNBR = ee.Image.constant(1.96 ).multiply(desvioNBR);
intervaloNBR = intervaloNBR.divide(raizTam);
var intervaloBAI = ee.Image.constant(1.96 ).multiply(desvioBAI);
intervaloBAI = intervaloBAI.divide(raizTam);

var intervaloMIRBI = ee.Image.constant(1.96 ).multiply(desvioMIRBI);
intervaloMIRBI = intervaloMIRBI.divide(raizTam);

if (export_original === true){
    name_img = 'images_real_intervaloNBR_portugal_fire'
    funct_export_Img(intervaloNBR, name_img, geome);
    name_img = 'images_real_intervaloBAIML_portugal_fire'
    funct_export_Img(intervaloBAI, name_img, geome);
    name_img = 'images_real_intervaloMIRBI_portugal_fire'
    funct_export_Img(intervaloMIRBI, name_img, geome);
}else{
    name_img = 'imagesN_intervaloNBR_portugal_fire'
    funct_export_Img(intervaloNBR, name_img, geome);
    name_img = 'imagesN_intervaloBAIML_portugal_fire'
    funct_export_Img(intervaloBAI, name_img, geome);
    name_img = 'imagesN_intervaloMIRBI_portugal_fire'
    funct_export_Img(intervaloMIRBI, name_img, geome);
}

Map.addLayer(serie_landsat, params.vis, 'ultImgaem')