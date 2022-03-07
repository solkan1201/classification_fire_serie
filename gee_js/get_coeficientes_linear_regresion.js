var params = {
    asset_output: 'users/CartasSol/temporal/',
    // asset_output: 'users/SarahMoura/Doutorado/Dados/ImgBase/',
    asset_input: 'users/SarahMoura/Doutorado/Dados/SerieLandsat',
    asset_meanNBR: 'users/SarahMoura/Doutorado/Dados/ImgBase/images_real_medianNBR_portugal_fire',
    asset_intervNBR: 'users/SarahMoura/Doutorado/Dados/ImgBase/images_real_intervaloNBR_portugal_fire',
    asset_meanBAI: 'users/SarahMoura/Doutorado/Dados/ImgBase/images_real_medianBAIML_portugal_fire',
    asset_intervBAI: 'users/SarahMoura/Doutorado/Dados/ImgBase/images_real_intervaloBAIML_portugal_fire',
    asset_meanMIRBI: 'users/SarahMoura/Doutorado/Dados/ImgBase/images_real_intervaloMIRBI_portugal_fire',
    asset_intervMIRBI: 'users/SarahMoura/Doutorado/Dados/ImgBase/images_real_intervaloMIRBI_portugal_fire',
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
var borderRemove = function (image){
    
    var polygon = image.geometry();

    return image.clip(
        polygon.buffer(-30000.0)
    );
};

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

var vis = {

    agricola: {
        min: 0, 
        max: 8, 
        palette: 'DCE0D6,E974ED,D5A6BD,C27BA0,F3B4F1,E787F8,FFF3BF'
    },
    vis_l8: { 
        min: 40, 
        max: 3500, 
        bands: ['swir1','nir', 'red'] 
    },
    visNBR: { 
        min: -0.8,
        max: 1.0,
        palette : 'E81C1C,E8631C,E8A01C,E8AD1C,E0FF33,E6E600,808000,C0FF33'
    },            
    visBAI: {
        min: -0.0000000253855532151,
        max: 0.00003611827560234815,
        palette : '3E9204,61e006,7af91f,98fb51,f3f985,edf63c,eaf419,bac309'
    },
    visMaskNBR: { 
        min: 0, 
        max: 1, 
        palette: 'FF0000'
    },
    visMaskBAI: { 
        min: 0, 
        max: 1, 
        palette: 'FFF633'
    }
   
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
var geome = imgCol.geometry();

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


var img_mediaNBR = ee.Image(params.asset_meanNBR);
var img_mediaBAI = ee.Image(params.asset_meanBAI);
var img_mediaMIRBI = ee.Image(params.asset_meanMIRBI);
// var img_intervalNBR = ee.Image(params.asset_intervNBR);
// var img_intervalBAI = ee.Image(params.asset_intervBAI);

var size_imgC = ee.Number(imgCol.size());
var seqTempo = ee.List.sequence(1, size_imgC.add(1));
var media_time = seqTempo.reduce(ee.Reducer.mean());

var denum_coef = seqTempo.map(function(val){
                        var valorDif = ee.Number(val).subtract(media_time).pow(2);
                        return valorDif;
                    })                  
denum_coef = denum_coef.reduce(ee.Reducer.sum());

serie_landsat = serie_landsat.toList(size_imgC);
var imCol_lstime = serie_landsat.zip(seqTempo)
print("lista img e time collection ", imCol_lstime)

var col_num_coef = imCol_lstime.map(function(parImgInd){
                var img = ee.Image(ee.List(parImgInd).get(0));
                var tempo = ee.Number(ee.List(parImgInd).get(1));
                                
                var imgDifNBR = img.select('nbr').subtract(img_mediaNBR);
                var imgDifBAI = img.select('baiml').subtract(img_mediaBAI);
                var imgDifBIRMI = img.select('mirbi').subtract(img_mediaMIRBI);

                var diftempo = tempo.subtract(media_time);

                var imgCoefNBR_b1 = imgDifNBR.multiply(ee.Image.constant(diftempo));
                imgCoefNBR_b1 = imgCoefNBR_b1.rename('coef_nbr_b1');  //.divide(ee.Image.constant(denum_coef))
                var imgCoefNBAI_b1 = imgDifBAI.multiply(ee.Image.constant(diftempo));
                imgCoefNBAI_b1 = imgCoefNBAI_b1.rename('coef_baiml_b1'); //.divide(ee.Image.constant(denum_coef))

                return ee.Image(imgCoefNBR_b1).addBands(imgCoefNBAI_b1);
        })

var im_num_coef = ee.ImageCollection(col_num_coef).reduce(ee.Reducer.sum());
im_num_coef = im_num_coef.select(["coef_nbr_b1_sum", "coef_baiml_b1_sum"], ["coef_nbr_b1", "coef_baiml_b1"]);

Map.addLayer(im_num_coef.select("coef_nbr_b1"))
Map.addLayer(im_num_coef.select("coef_baiml_b1"))
im_num_coef = im_num_coef.divide(ee.Image.constant(denum_coef));
Map.addLayer(im_num_coef.select("coef_nbr_b1"))
Map.addLayer(im_num_coef.select("coef_baiml_b1"))

// print(im_num_coef)


// ================== INDICES DE PRIMEIRO E ULTIMO DADO ===============================//

var ind_first = 'LE07_204031_20010203_normal'
var ind_last = 'LC08_204031_20140927_normal'
serie_landsat = ee.ImageCollection(serie_landsat);
var img_first = serie_landsat.filter(ee.Filter.eq('system:index', ind_first));
img_first = ee.Image(img_first.first())
print(img_first)
var img_last = serie_landsat.filter(ee.Filter.eq('system:index', ind_last))
img_last = ee.Image(img_last.first());
img_last = ee.Image(img_last)


var imgCoefNBR_b0 = img_mediaNBR.subtract(im_num_coef.select('coef_nbr_b1').multiply(ee.Image.constant(media_time)));
imgCoefNBR_b0 =  imgCoefNBR_b0.rename('coef_nbr_b0')
var imgCoefBAI_b0 = img_mediaBAI.subtract(im_num_coef.select('coef_baiml_b1').multiply(ee.Image.constant(media_time)));
imgCoefBAI_b0 = imgCoefBAI_b0.rename('coef_baiml_b0')

Map.addLayer(imgCoefNBR_b0)
Map.addLayer(imgCoefBAI_b0)

im_num_coef = im_num_coef.addBands(imgCoefNBR_b0).addBands(imgCoefBAI_b0);

Map.addLayer(img_first, vis.vis_l8, 'fisrt');
Map.addLayer(img_first.select('nbr'), vis.visNBR, "NBR_first")
Map.addLayer(img_first.select('baiml'), vis.visBAI, "BAI_first")    
Map.addLayer(img_mediaNBR,vis.visNBR, "NBR_Media", false)
Map.addLayer(img_last, vis.vis_l8, 'last');
Map.addLayer(img_last.select('nbr'), vis.visNBR, "NBR_last")
Map.addLayer(img_last.select('baiml'), vis.visBAI, "BAI_last")        
Map.addLayer(img_mediaBAI, vis.visBAI, "BAI_Media", false)

var name_img = 'image_coeficientes_portugal_fire'
funct_export_Img(im_num_coef, name_img, geome);