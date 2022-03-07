
//Coleção landsat Index 

// Register a function to draw a chart when a user clicks on the map.
var Normalized_Burn_Ratio = function(img){
    var nbrImg = img.expression(
        "float((b('nir') - b('swir2')) / (b('nir') + b('swir2')))").rename(['nbr']);     
    
    return img.addBands(nbrImg);
}
var Normalized_Burn_Ratio_2 = function(img){
    var nbrImg = img.expression(
        "float((b('swir1') - b('swir2')) / (b('swir1') + b('swir2')))").rename(['nbr2']);     
    
    return img.addBands(nbrImg);
}
var Burned_Area_Index = function(img){
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
var Normalized_Difference_Vegetation_Index  = function(img){
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



var params = {    
    asset_inputS: 'users/sdoutorado/serieManchasFire', 
    asset_polg_fire: 'users/SarahMoura/Doutorado/areaArdida/AA_nut3_',
    limitPort: 'users/SarahMoura/Doutorado/limitePT',
    bnd_int: ['nir', 'nbr', 'mirbi','dNBR'],
    lst_year: ['2001','2002','2003','2004','2005','2006','2007','2008','2009',
               '2010','2011','2012','2013','2014','2015','2016','2017','2018',
               '2019','2020']     
}



var imgColSerie = ee.ImageCollection(params.asset_inputS).sort('system:time_start');

var limit_port = ee.FeatureCollection(params.limitPort);
// var geome = imgColSerie.geometry();
var size_imgC = imgColSerie.size();
print("tamanho image collection ", size_imgC)
var imgLandsat = null;

var year_selected = '2020';
var mes_start_selected = 'janeiro'
var mes_end_selected = 'janeiro'
var lst_indexImage = []
var indexImage = '';
var date_start = '2020-01-01'
var date_end = '2020-08-01'
var visualizado = false;
var vis = {
    nbr: { 
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
    ruido: {
        min: 0, 
        max: 1, 
        palette :'FFFFFF,FF0000'
    },
    vis_l8: { 
        min: 40, 
        max: 3500, 
        bands: ['swir1','nir', 'red'] 
    },

}



var funct_export_ROIs = function(FeatROI, MNAMEROI){
    
    var IdAsset = 'users/sdoutorado/ROIsClass/' +  MNAMEROI
        
    var optExp = {
            'collection': FeatROI, 
            'description': MNAMEROI, 
            'assetId': IdAsset        
        }

    Export.table.toAsset(optExp)
    print ("salvando ... !", MNAMEROI)
        
    var optExpN = {
            'collection': FeatROI, 
            'description': MNAMEROI, 
            'folder':"Alerta"        
        }
    Export.table.toDrive(optExpN)
    

    print("salvou to drive")
}



var listCol = imgColSerie.filterDate(date_start, date_end);
lst_indexImage = listCol.reduceColumns(ee.Reducer.toList(), ['system:index']).get('list').getInfo();
print("length of list images ", lst_indexImage.length)

indexImage = lst_indexImage[0]


var imgRuidoShow = imgColSerie.filter(ee.Filter.eq('system:index', indexImage)).first();    

var strId = indexImage.slice(0, -7);
print("Index da collection Landsat ", strId)
var patronl8 = ee.String(strId).index('LC08');
var patronl7 = ee.String(strId).index('LE07');
print("patron L8 ==  0 ==  ", patronl8)
var bands_L57 = ["B1","B3","B4","B5","B7"];
var bands_L8 = ["B2","B4","B5","B6","B7"];
var bnds_name = ["blue","red","nir","swir1","swir2"];            
imgLandsat =  ee.Algorithms.If(
                    ee.Algorithms.IsEqual(patronl8, -1),
                    ee.Algorithms.If(
                        ee.Algorithms.IsEqual(patronl7, -1),
                        ee.Image('LANDSAT/LT05/C01/T1_SR/' + strId).select(bands_L57, bnds_name),
                        ee.Image('LANDSAT/LE07/C01/T1_SR/' + strId).select(bands_L57, bnds_name)
                    ),
                    ee.Image('LANDSAT/LC08/C01/T1_SR/'  + strId).select(bands_L8, bnds_name)
            );
print("imagem Landsat ", imgLandsat);
imgLandsat = Normalized_Burn_Ratio(ee.Image(imgLandsat));

Map.addLayer(ee.Image(imgLandsat), vis.vis_l8, strId);
Map.addLayer(imgLandsat.select('nbr'), vis.nbr, 'NBR');
Map.addLayer(imgRuidoShow, vis.ruido, "mancha Fire");
Map.setCenter(-7.9417, 41.5773, 12);
visualizado = true
print(Map.layers())


imgLandsat = Burned_Area_Index(ee.Image(imgLandsat));
imgLandsat = Burned_Area_Index_Mod_SWIR1(ee.Image(imgLandsat));
imgLandsat = Burned_Area_Index_Mod_SWIR2(ee.Image(imgLandsat));
imgLandsat = Mid_Infrared_Burn_Index(ee.Image(imgLandsat));
imgLandsat = Normalized_Difference_Moisture_Index(ee.Image(imgLandsat));
imgLandsat = Normalized_Difference_Vegetation_Index(ee.Image(imgLandsat));
imgLandsat = Soil_Adjusted_Vegetation_Index(ee.Image(imgLandsat));
imgLandsat = Enhanced_Vegetation_Index(ee.Image(imgLandsat));

var poligons = ee.FeatureCollection(fire).merge(ee.FeatureCollection(notFire));

var rois = imgLandsat.sampleRegions({
                    collection: poligons, 
                    properties: ['class'], 
                    scale: 30, 
                    tileScale: 4, 
                    geometries: true
                });

funct_export_ROIs (rois, indexImage + '_rois');