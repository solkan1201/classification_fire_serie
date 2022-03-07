
// Register a function to draw a chart when a user clicks on the map.
var  Normalized_Burn_Ratio = function(img){
    var nbrImg = img.expression(
        "float((b('nir') - b('swir2')) / (b('nir') + b('swir2')))").rename(['nbr']);     
    
    return img.addBands(nbrImg);
}
var Normalized_Burn_Ratio_2= function(img){
    var nbrImg = img.expression(
        "float((b('swir1') - b('swir2')) / (b('swir1') + b('swir2')))").rename(['nbr2']);     
    
    return img.addBands(nbrImg);
}
var Burned_Area_Index= function(img){
    var baiImg = img.expression(
        "float(1/ ((0.06 - b('nir'))**2 + (0.1 - b('red'))**2))").rename(['bai']);     
    
    return img.addBands(baiImg);
}
var indice_verde = function(img){
    var verde_Img = img.expression(
        "float(0.0 / b('nir'))").rename(['zero']);     
    
    return img.addBands(verde_Img);
}
var Burned_Area_Index_Mod_SWIR1 = function(img){
    var baimsImg = img.expression(
        "float(1/ ((0.06 - b('nir'))**2 + (0.1 - b('swir1'))**2))").rename(['baims']);     
    
    return img.addBands(baimsImg);
}
var Burned_Area_Index_Mod_SWIR2 = function(img){
    var baimlImg = img.expression(
        "float(1/ ((0.06 - b('nir'))**2 + (0.1 - b('swir2'))**2))").rename(['baiml']);     
    
    return img.addBands(baimlImg);
}
var Mid_Infrared_Burn_Index = function(img){
    var mirBIImg = img.expression(
        "float((0.06 * b('swir1')) - (9.8 * b('swir2')) + 2)").rename(['mirbi']);     
    
    return img.addBands(mirBIImg);
}
var Normalized_Difference_Moisture_Index = function(img){
    var ndmiImg = img.expression(
        "float((b('nir') - b('swir1')) / (b('nir') + b('swir1')))").rename(['ndmi']);     
    
    return img.addBands(ndmiImg);
}
var Normalized_Difference_Vegetation_Index = function(img){
    var ndviImg = img.expression(
        "float((b('nir') - b('red')) / (b('nir') + b('red')))").rename(['ndvi']);     
    
    return img.addBands(ndviImg);
}
var Soil_Adjusted_Vegetation_Index = function(img){
    var saviImg = img.expression(
        "float(1.5 * (b('nir') - b('red')) / (b('nir') + b('red') + 0.5))").rename(['savi']);     
    
    return img.addBands(saviImg);
}
var Enhanced_Vegetation_Index = function(img){
    var eviImg = img.expression(
        "float(2.5 * (b('nir') - b('swir2')) / (b('nir') + 6 * b('red') + 7.5 * b('blue') + 1))").rename(['evi']);     
    
    return img.addBands(eviImg);
}



var vis = {

    'nbr': { 
        min: -0.8,
        max: 1.0,
        palette : 'C0FF33,E0FF33,FFEB33,E8AD1C,E8A01C,E8831C,E8631C,E8531C,E8361C,E81C1C,B8290B'
    },
    baiml: {
        min: -0.0000000253855532151,
        max: 0.00003611827560234815,
        palette : '3E9204,39B80B,51B80B,93D108,DAF322,E7F322,EAF419,F0FC06'
    },
    mirbi: { 
        min: 0, 
        max: 1, 
        palette : '3E9204,39B80B,51B80B,93D108,DAF322,E7F322,EAF419,F0FC06'
    },
    vis_l8: { 
        min: 40, 
        max: 3500, 
        bands: ['swir1','nir', 'red'] 
    },
    mancha: {
        min: 0, max: 1, palette: '000000,ff0000'
    },
    classe: {min: 0, max: 1, palette: '000000,ff00AA'}
}


var bands_L57 = ["B1","B3","B4","B5","B7"]
var bands_L8 = ["B2","B4","B5","B6","B7"]
var bnds_name = ["blue","red","nir","swir1","swir2"]




var params = {    
    asset_inputS: 'users/sdoutorado/serieManchasFire', 
    asset_polg_fire: 'users/SarahMoura/Doutorado/areaArdida/AA_nut3_',
    limitPort: 'users/SarahMoura/Doutorado/limitePT',
    asset_rois: 'users/sdoutorado/ROIsClass',
    bnd_int: ['nir', 'nbr', 'mirbi','dNBR'],
    lst_year: ['2001','2002','2003','2004','2005','2006','2007','2008','2009','2010',
                '2011','2012','2013','2014','2015','2016','2017','2018','2019','2020']     
}

var mancha = ee.Image(params.asset_inputS + '/LE07_204031_20010915_normal')
var limitPT = ee.FeatureCollection(params.limitPort)
var imgLandsat = ee.Image('LANDSAT/LE07/C01/T1_SR/LE07_204031_20010915')
var imgLandsat_pre = ee.Image('LANDSAT/LE07/C01/T1_SR/LE07_204031_20010729')

var roi_year = ee.FeatureCollection(params.asset_rois + '/' + 'LE07_204031_20010915_normal_rois')
print("ROIS fo year ", roi_year.limit(2));

imgLandsat = imgLandsat.updateMask(mancha).select(bands_L57, bnds_name)
imgLandsat = imgLandsat.clip(limitPT);
imgLandsat_pre  =imgLandsat_pre.updateMask(mancha).select(bands_L57, bnds_name)
imgLandsat_pre = imgLandsat_pre.clip(limitPT);

imgLandsat = Normalized_Burn_Ratio(imgLandsat)
imgLandsat_pre = Normalized_Burn_Ratio(imgLandsat_pre)

var difNBR = imgLandsat_pre.select('nbr').subtract(imgLandsat.select('nbr')).rename('dnbr')
var difNIR = imgLandsat_pre.select('nir').subtract(imgLandsat.select('nir')).rename('dnirr')

imgLandsat = Burned_Area_Index(ee.Image(imgLandsat))
imgLandsat = Burned_Area_Index_Mod_SWIR1(ee.Image(imgLandsat))
imgLandsat = Burned_Area_Index_Mod_SWIR2(ee.Image(imgLandsat))
imgLandsat = Mid_Infrared_Burn_Index(ee.Image(imgLandsat))
imgLandsat_pre = Mid_Infrared_Burn_Index(ee.Image(imgLandsat_pre))
var difMIRBI = imgLandsat_pre.select('mirbi').subtract(imgLandsat.select('mirbi')).rename('dmirbi')

imgLandsat = Normalized_Difference_Moisture_Index(ee.Image(imgLandsat))
imgLandsat = Normalized_Difference_Vegetation_Index(ee.Image(imgLandsat))
imgLandsat_pre = Normalized_Difference_Vegetation_Index(ee.Image(imgLandsat_pre))
var difNDVI = imgLandsat_pre.select('ndvi').subtract(imgLandsat.select('ndvi')).rename('dndvi')

imgLandsat = Soil_Adjusted_Vegetation_Index(ee.Image(imgLandsat))
imgLandsat = Enhanced_Vegetation_Index(ee.Image(imgLandsat))
imgLandsat = imgLandsat.addBands(difNBR).addBands(difNIR).addBands(difMIRBI).addBands(difNDVI) 


var columnaTraining = ['dmirbi', 'dnbr', 'dndvi', 'dnirr', 'evi', 'mirbi', 'nbr', 'nir', 'swir1', 'red', 'savi']

var pmtRF = {        
    'numberOfTrees': 160, 
    'variablesPerSplit': 7,
    'minLeafPopulation': 10,
    'bagFraction': 0.8
}
var serializeClassificador = ee.Classifier.smileRandomForest(pmtRF).train(roi_year , 'class', columnaTraining)

var imgClass = imgLandsat.classify(serializeClassificador, 'fire')
imgClass = imgClass.updateMask(mancha)

Map.addLayer(imgLandsat , vis.vis_l8, "l8")
Map.addLayer(mancha.selfMask(), vis.mancha, 'mancha')

Map.addLayer(imgClass.selfMask(), vis.classe, 'clasF')
