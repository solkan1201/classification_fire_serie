var params = {
    asset_l8: 'LANDSAT/LC08/C01/T1_SR/LC08_204031_20171106',
    asset_l7: 'LANDSAT/LE07/C01/T1_SR/LE07_204031_20010915',
    asset_l5: 'LANDSAT/LT05/C01/T1_SR/LT05_204031_20050918',
    asset_output: 'users/SarahMoura/Doutorado/imgReference/Imgref/',
    bnd_int: ['red', 'nir', 'swir1', 'swir2'],
    bnd_l5: ['B3', 'B4', 'B5', 'B7'],
    bnd_l7: ['B3', 'B4', 'B5', 'B7'],
    bnd_l8: ['B4', 'B5', 'B6', 'B7'],
    path: 204,
    row: '31'

}
var funct_export_Img = function(imagem, name_im, geom){
    
    var asset_path = params.asset_output + name_im
    var ptro_exp = {
        image: imagem, 
        description: name_im,  
        assetId: asset_path, 
        pyramidingPolicy: {".default": 'mode'},
        region: geom,
        scale: 15,
        maxPixels: 1e11               
    }

    Export.image.toAsset(ptro_exp)
}


var geom_landsat = {

    toClip: ee.Geometry.Polygon([[
                [-8.584115624999995,40.991217330289615],
                [-7.133920312499995,40.991217330289615],
                [-7.133920312499995,41.96655535345329],
                [-8.584115624999995,41.96655535345329],
                [-8.584115624999995,40.991217330289615]
    ]]),
    tolimit: ee.Geometry.Polygon([[
        [-8.839547753906245,41.83367534450775],
        [-8.839547753906245,41.73537111581778],
        [-8.784616113281245,41.62870481886988],
        [-8.762643457031245,41.51774886721809],
        [-8.751657128906245,41.39012001997338],
        [-8.691232324218745,41.24985133239089],
        [-8.625314355468745,41.10928084587815],
        [-8.608834863281245,41.026451425382014],
        [-8.213327050781245,40.95181575345414],
        [-7.702462792968745,40.877095614588264],
        [-7.241037011718745,40.81060682841296],
        [-7.026803613281245,41.4724899566634],
        [-6.801583886718745,42.099158783412456],
        [-6.719186425781245,42.35135776156134],
        [-7.199610633643909,42.43547475903729],
        [-7.960641503906245,42.537821875300416],
        [-8.685739160156245,42.64700967440985],
        [-8.526437402343745,42.33917778318377],
        [-8.685739160156245,42.184693842798644],
        [-8.817575097656245,42.05430859463912],
        [-8.839547753906245,41.83367534450775]
    ]]),
};

var ls_im = ['asset_l5', 'asset_l7', 'asset_l8']
var dict_nam = {
    'asset_l5': 'img_refence_L5', 
    'asset_l7': 'img_refence_L7', 
    'asset_l8': 'img_refence_L8'
};


ls_im.forEach(function(idLandsat){

    var tepm_im  = ee.Image(params[idLandsat]);    
    switch (idLandsat) {
        case 'asset_l5':
            tepm_im = tepm_im.select(params.bnd_l5, params.bnd_int);
            
            break;
        case 'asset_l7':
            tepm_im = tepm_im.select(params.bnd_l7, params.bnd_int);
            break;
        case 'asset_l8':
            tepm_im = tepm_im.select(params.bnd_l8, params.bnd_int);            
            break;            
    }

    print("imagem ", tepm_im)
    tepm_im = tepm_im.clip(geom_landsat.toClip)
    var name_exp = dict_nam[idLandsat]
    
    funct_export_Img(tepm_im, name_exp, geom_landsat.toClip)
})

