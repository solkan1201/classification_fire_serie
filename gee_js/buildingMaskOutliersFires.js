var params = {
    // asset_output: 'users/CartasSol/temporal/',
    asset_output: 'users/SarahMoura/Doutorado/Dados/Serie_indices_Landsat/',
    asset_input: 'users/SarahMoura/Doutorado/Dados/SerieLandsat',
    asset_meanNBR: 'users/SarahMoura/Doutorado/Dados/ImgBase/images_real_medianNBR_portugal_fire',
    asset_intervNBR: 'users/SarahMoura/Doutorado/Dados/ImgBase/images_real_intervaloNBR_portugal_fire',
    asset_meanBAIML: 'users/SarahMoura/Doutorado/Dados/ImgBase/images_real_medianBAIML_portugal_fire',
    asset_intervBAIML: 'users/SarahMoura/Doutorado/Dados/ImgBase/images_real_intervaloBAIML_portugal_fire',
    asset_Coef: 'users/SarahMoura/Doutorado/Dados/ImgBase/image_coeficientes_portugal_fire',
    bnd_int: ['red', 'nir', 'swir1', 'swir2']    

}
var export_original = true;
var vis = {

    agricola: {
        min: 0, 
        max: 8, 
        palette: 'DCE0D6,E974ED,D5A6BD,C27BA0,F3B4F1,C59FF4,E787F8,FFD966,FFF3BF'
    },
    vis_l8: { 
        min: 40, 
        max: 3500, 
        bands: ['swir1','nir', 'red'] 
    },
    visNBR: { 
        min: -0.8,
        max: 1.0,
        palette : 'C0FF33,E0FF33,FFEB33,E8AD1C,E8A01C,E8831C,E8631C,E8531C,E8361C,E81C1C,B8290B'
    },
    visBAI: {
        min: -0.0000000253855532151,
        max: 0.00003611827560234815,
        palette : '3E9204,39B80B,51B80B,93D108,DAF322,E7F322,EAF419,F0FC06'
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

var borderRemove = function (image){
    
    var polygon = image.geometry();

    return image.clip(
        polygon.buffer(-500.0)
    );
};

var  Normalized_Burn_Ratio = function(img){
    var nbrImg = img.expression(
        "float((b('nir') - b('swir2')) / (b('nir') + b('swir2')))").rename(['nbr']);     
    
    return img.addBands(nbrImg);
}

var Burned_Area_Index= function(img){
    var baiImg = img.expression(
        "float(1/ ((0.06 - b('nir'))**2 + (0.1 - b('red'))**2))").rename(['bai']);     
    
    return img.addBands(baiImg);
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

var imgCol = ee.ImageCollection(params.asset_input).sort('system:time_start');
var geome = imgCol.geometry();
var size_imgC = ee.Number(imgCol.size());

if (export_original === true){
    print("mudou ")
    var serie_landsat = imgCol.map(get_landsatCollection);
    // var teste = get_landsatCollection(serie_landsat_Col.first())
    // print(teste)
}else{
    var serie_landsat = imgCol;
}


serie_landsat = serie_landsat.map(Normalized_Burn_Ratio);
serie_landsat = serie_landsat.map(Burned_Area_Index);

var ampliInterv = 3;
var img_mediaNBR = ee.Image(params.asset_meanNBR);
var img_mediaBAI = ee.Image(params.asset_meanBAIML);
var img_intervalNBR = ee.Image(params.asset_intervNBR);
var img_intervalBAI = ee.Image(params.asset_intervBAIML);

var img_coeficients = ee.Image(params.asset_Coef);

var limiarNBR = -0.2;
var limiarBAI = 0.000002;

serie_landsat = serie_landsat.toList(size_imgC);
serie_landsat = ee.List(serie_landsat)

print(serie_landsat)
print(serie_landsat.get(4))
var seqTempo = ee.List.sequence(0, ee.Number(size_imgC).subtract(1)).getInfo();



seqTempo.slice(0, 1).forEach(function(val){
        // print(val)
        // val = ee.Number(val);
        var indEst_NBR = ee.Image.constant(val).multiply(
                                    img_coeficients.select('coef_nbr_b1')).add(
                                        img_coeficients.select('coef_nbr_b0')).rename('nbr_est');
        indEst_NBR = indEst_NBR.clip(geome);
        var indEst_BAI = ee.Image.constant(val).multiply(
                                    img_coeficients.select('coef_bai_b1')).add(
                                        img_coeficients.select('coef_bai_b0')).rename('bai_est');
        indEst_BAI = indEst_BAI.clip(geome);
        
        var indEst_NBRSup = indEst_NBR.add(img_intervalNBR.multiply(ee.Image.constant(ampliInterv)));
        var indEst_NBRSInf = indEst_NBR.subtract(img_intervalNBR.multiply(ee.Image.constant(ampliInterv)));
        var indEst_BAISup = indEst_BAI.add(img_intervalBAI.multiply(ee.Image.constant(ampliInterv)));
        var indEst_BAIInf = indEst_BAI.subtract(img_intervalBAI.multiply(ee.Image.constant(ampliInterv)));
        
        var imgNBR = ee.Image(serie_landsat.get(val)).select('nbr');
        var imgBAI = ee.Image(serie_landsat.get(val)).select('bai');

        var imgMaskOutlierNBR = imgNBR.gt(indEst_NBRSup).add(imgNBR.lt(indEst_NBRSInf));
        imgMaskOutlierNBR = imgMaskOutlierNBR.lte(1).rename('mask_nbr');

        var imgMaskOutlierBAI = imgBAI.gt(indEst_BAISup).add(imgBAI.gt(indEst_BAIInf));
        imgMaskOutlierBAI = imgMaskOutlierBAI.gte(1).rename('mask_bai');
        var bandInt = ["red","nir","swir1","nbr","bai"]
        var imgExp = ee.Image(serie_landsat.get(val)).select(bandInt).addBands(imgMaskOutlierNBR)
                                    .addBands(imgMaskOutlierBAI);
        
        // var name_im = imgExp.get('system:index').getInfo();
        var name_im = imgExp.id().getInfo();

        Map.addLayer(imgExp, vis.vis_l8, name_im);
        Map.addLayer(imgNBR, vis.visNBR, "NBR")
        Map.addLayer(imgMaskOutlierNBR, {min:0, max: 1, palette: 'FF0000'}, 'maskNBR')
        Map.addLayer(imgBAI, vis.visBAI, "BAI")        
        Map.addLayer(imgMaskOutlierBAI, {min:0, max: 1, palette: 'FF00FF'}, 'maskBAI')
        funct_export_Img(imgExp, name_im, geome);

})

