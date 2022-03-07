var params = {
    asset_output: 'users/sdoutorado/indices/',
    // asset_output: 'users/SarahMoura/Doutorado/Dados/ImgBase/',
    asset_input: 'users/sdoutorado/serie_indices_inLansat',
    asset_meanNBR: 'users/sdoutorado/indices/images_real_medianNBR_portugal_fire',
    asset_intervNBR: 'users/sdoutorado/indices/images_real_intervaloNBR_portugal_fire',
    asset_meanBAI: 'users/sdoutorado/indices/images_real_medianBAIML_portugal_fire',
    asset_intervBAI: 'users/sdoutorado/indices/images_real_intervaloBAIML_portugal_fire',
    asset_meanMIRBI: 'users/sdoutorado/indices/images_real_intervaloMIRBI_portugal_fire',
    asset_intervMIRBI: 'users/sdoutorado/indices/images_real_intervaloMIRBI_portugal_fire',
    bnd_int: ['red', 'nir', 'swir1', 'swir2'],
    vis: {
        bands: ["swir1","nir","red"],
        gamma: 1,
        max: 3723,
        min: 153,
        opacity: 1
    }

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



var serie_landsat_index = ee.ImageCollection(params.asset_input).sort('system:time_start');
var geome = serie_landsat_index.geometry();

var img_mediaNBR = ee.Image(params.asset_meanNBR);
var img_mediaBAI = ee.Image(params.asset_meanBAI);
var img_mediaMIRBI = ee.Image(params.asset_meanMIRBI);
// var img_intervalNBR = ee.Image(params.asset_intervNBR);
// var img_intervalBAI = ee.Image(params.asset_intervBAI);

var size_imgC = ee.Number(serie_landsat_index.size());
var raizTam = ee.Number(size_imgC).sqrt();
var seqTempo = ee.List.sequence(1, size_imgC.add(1));
var media_time = seqTempo.reduce(ee.Reducer.mean());

var denum_coef = seqTempo.map(function(val){
                        var valorDif = ee.Number(val).subtract(media_time).pow(2);
                        return valorDif;
                    })                  
denum_coef = denum_coef.reduce(ee.Reducer.sum());

serie_landsat_index = serie_landsat_index.toList(size_imgC);
var imCol_lstime = serie_landsat_index.zip(seqTempo)
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
serie_landsat_index = ee.ImageCollection(serie_landsat_index);
var img_first = serie_landsat_index.filter(ee.Filter.eq('system:index', ind_first));
img_first = ee.Image(img_first.first())
print(img_first)
var img_last = serie_landsat_index.filter(ee.Filter.eq('system:index', ind_last))
img_last = ee.Image(img_last.first());
img_last = ee.Image(img_last)


var imgCoefNBR_b0 = img_mediaNBR.subtract(im_num_coef.select('coef_nbr_b1').multiply(ee.Image.constant(media_time)));
imgCoefNBR_b0 =  imgCoefNBR_b0.rename('coef_nbr_b0')
var imgCoefBAI_b0 = img_mediaBAI.subtract(im_num_coef.select('coef_baiml_b1').multiply(ee.Image.constant(media_time)));
imgCoefBAI_b0 = imgCoefBAI_b0.rename('coef_baiml_b0')

Map.addLayer(imgCoefNBR_b0)
Map.addLayer(imgCoefBAI_b0)

im_num_coef = im_num_coef.addBands(imgCoefNBR_b0).addBands(imgCoefBAI_b0);

Map.addLayer(img_first.select('nbr'), vis.visNBR, "NBR_first")
Map.addLayer(img_first.select('baiml'), vis.visBAI, "BAI_first")    
Map.addLayer(img_mediaNBR,vis.visNBR, "NBR_Media", false)

Map.addLayer(img_last.select('nbr'), vis.visNBR, "NBR_last")
Map.addLayer(img_last.select('baiml'), vis.visBAI, "BAI_last")        
Map.addLayer(img_mediaBAI, vis.visBAI, "BAI_Media", false)

var name_img = 'image_coeficientes_portugal_fire'
funct_export_Img(im_num_coef, name_img, geome);