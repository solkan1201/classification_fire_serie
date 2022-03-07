//EXPORTAR PONTO 01

// https://code.earthengine.google.com/db93d1df5c91cae3d062ecfedd6c601a  == ptos coleta V1
//https://code.earthengine.google.com/efe9b20561b242fc70cf81aa621bc924   == ptos coleta V2
//https://code.earthengine.google.com/da6329625605bebdf6d76fbe67812155   == ptos coleta V3
//https://code.earthengine.google.com/fdbad948ba7feb3f6f1356bd4cd1e36e   == ptos coleta V4
// https://code.earthengine.google.com/55161d2a20380ffd68c9d2266acfb542  == ptos coleta V5

    // Register a function to draw a chart when a user clicks on the map.
    var  Normalized_Burn_Ratio = function(img){
        var nbrImg = img.divide(10000).expression(
            "float((b('nir') - b('swir2')) / (b('nir') + b('swir2')))").rename(['nbr']);     
        
        return img.addBands(nbrImg); 
    }
var Normalized_Burn_Ratio_2= function(img){
        var nbrImg = img.divide(10000).expression(
            "float((b('swir1') - b('swir2')) / (b('swir1') + b('swir2')))").rename(['nbr2']);     
        
        return img.addBands(nbrImg);
    }
var Burned_Area_Index= function(img){
        var baiImg = img.divide(10000).expression(
            "float(1/ ((0.06 - b('nir'))**2 + (0.1 - b('red'))**2))").rename(['bai']);     
        
        return img.addBands(baiImg);
    }
var indice_verde = function(img){
        var verde_Img = img.divide(10000).expression(
            "float(0.0 / b('nir'))").rename(['zero']);     
        
        return img.addBands(verde_Img);
    }
var Burned_Area_Index_Mod_SWIR1 = function(img){
        var baimsImg = img.divide(10000).expression(
            "float(1/ ((0.05 - b('nir'))**2 + (0.2 - b('swir1'))**2))").rename(['baims']);     
        
        return img.addBands(baimsImg);
    }
var Burned_Area_Index_Mod_SWIR2 = function(img){
        var baimlImg = img.divide(10000).expression(
            "float(1/ ((0.05 - b('nir'))**2 + (0.2 - b('swir2'))**2))").rename(['baiml']);     
        
        return img.addBands(baimlImg);
    }
var Mid_Infrared_Burn_Index = function(img){
        var mirBIImg = img.divide(10000).expression(
            "float((0.06 * b('swir1')) - (9.8 * b('swir2')) + 2)").rename(['mirbi']);     
        
        return img.addBands(mirBIImg);
    }
var Normalized_Difference_Moisture_Index = function(img){
        var ndmiImg = img.divide(10000).expression(
            "float((b('nir') - b('swir1')) / (b('nir') + b('swir1')))").rename(['ndmi']);     
        
        return img.addBands(ndmiImg);
    }
var Normalized_Difference_Vegetation_Index = function(img){
        var ndviImg = img.divide(10000).expression(
            "float((b('nir') - b('red')) / (b('nir') + b('red')))").rename(['ndvi']);     
        
        return img.addBands(ndviImg);
    }
var Soil_Adjusted_Vegetation_Index = function(img){
        var saviImg = img.divide(10000).expression(
            "float(1.5 * (b('nir') - b('red')) / (b('nir') + b('red') + 0.5))").rename(['savi']);     
        
        return img.addBands(saviImg);
    }
var Enhanced_Vegetation_Index = function(img){
        var eviImg = img.divide(10000).expression(
            "float(2.5 * (b('nir') - b('swir2')) / (b('nir') + 6 * b('red') + 7.5 * b('blue') + 1))").rename(['evi']);     
        
        return img.addBands(eviImg);
    }


var function_of_collected = function (img_col, feat_rois, export_orig){

        var ls_ids = img_col.reduceColumns(ee.Reducer.toList(), ['system:index']).get('list');

        ee.List(ls_ids).evaluate(function(list_ids){
            
            var rois_merg = ee.FeatureCollection([]);

            list_ids.forEach(function(idimg){
              
                var img = img_col.filter(ee.Filter.eq('system:index', idimg)).first()

                var pmt_red = {
                    collection: feat_rois, 
                    properties: ['class', 'year','ids'], 
                    scale: 30, 
                    tileScale: 2, 
                    geometries: true
                };
                
                var feat_tmp = img.sampleRegions(pmt_red);

                feat_tmp = feat_tmp.map(function(feat){
                                    return feat.set('year_rois', img.id())
                });
                
                rois_merg = rois_merg.merge(feat_tmp);

            })
                
            if(export_orig=== true){ name_ROIs = 'rois_serieLandsat_real_ptosV1' }
            
            var optExp = {
                'collection': rois_merg, 
                'description': name_ROIs, 
                'assetId':  param.asset_output + name_ROIs        
            }
            Export.table.toAsset(optExp)
            optExp = {
                'collection': rois_merg, 
                'description': name_ROIs, 
                'folder':  'CSV_ROIs'        
            }
            Export.table.toDrive(optExp)
                        
            print(" mostra ", rois_merg)
        });                
}

var get_landsatCollection = function (img){
  
            var id_l = img.id();
            // print("id da image ", id_l)
            var strId = ee.String(id_l).slice(0, -7);

            var patronl8 = strId.index('LC08');
            var patronl7 = strId.index('LE07');
            
            var bands_L57 = ["B1","B3","B4","B5","B7"];
            var bands_L8 = ["B2","B4","B5","B6","B7"];
            var bnds_name = ["blue","red","nir","swir1","swir2"];            
            var img_new =  ee.Algorithms.If(
                                  ee.Algorithms.IsEqual(patronl8, -1),
                                  ee.Algorithms.If(
                                      ee.Algorithms.IsEqual(patronl7, -1),
                                      ee.ImageCollection('LANDSAT/LT05/C01/T1_SR').filter(
                                                          ee.Filter.eq('system:index', strId)
                                                          ).first().select(bands_L57, bnds_name),
                                      ee.ImageCollection('LANDSAT/LE07/C01/T1_SR').filter(
                                                          ee.Filter.eq('system:index', strId)
                                                          ).first().select(bands_L57, bnds_name)
                                    ),
                                  ee.ImageCollection('LANDSAT/LC08/C01/T1_SR').filter(
                                                ee.Filter.eq('system:index', strId)
                                                ).first().select(bands_L8, bnds_name)
                            );
          
                                              
            return img_new;
    };

var param =  {
    asset_serie: 'users/SarahMoura/Doutorado/Dados/SerieLandsat',
    //asset_seriev2: 'users/SarahMoura/Doutorado/Dados/serie2',
    asset_polg_fire: 'users/SarahMoura/Doutorado/areaArdida/AA_nut3_',
    asset_limit : 'users/SarahMoura/Doutorado/bufferNut3',
    asset_output: 'users/SarahMoura/Doutorado/PontoCorrt/',
     
    serie_landsat: null,
    serie_landsat_year: null,
    limite_est: null,
    year_selected: 2020,
    number_bnd: 1
};

var export_original = false;
//=====================================================================//
//== GET IMAGES COLLECTIONS NORMALIZES AND CALCULATE SPECTRALS INDEX ==//
//=====================================================================//

//var serie_landsat = ee.ImageCollection(param.asset_serie).merge(
//                       ee.ImageCollection(param.asset_seriev2)).sort("system:index");
                        
var serie_landsat_Col = ee.ImageCollection(param.asset_serie).sort("system:index"); 
// image collection sorted by date system

if (export_original === true){
    print("mudou ")
    var serie_landsat = serie_landsat_Col.map(get_landsatCollection);
    // var teste = get_landsatCollection(serie_landsat_Col.first())
    // print(teste)
}else{
    var serie_landsat = serie_landsat_Col;
}

var ls_ind = serie_landsat.reduceColumns(ee.Reducer.toList(), ['system:index']).get('list');
print(ls_ind)
// image collection sorted by date system

if (export_original === true){
     serie_landsat = serie_landsat.map(get_landsatCollection);
}

serie_landsat = serie_landsat.map(Normalized_Burn_Ratio);
serie_landsat = serie_landsat.map(Normalized_Burn_Ratio_2);
serie_landsat = serie_landsat.map(Burned_Area_Index);
serie_landsat = serie_landsat.map(Burned_Area_Index_Mod_SWIR1);
serie_landsat = serie_landsat.map(Burned_Area_Index_Mod_SWIR2);
serie_landsat = serie_landsat.map(Mid_Infrared_Burn_Index);
serie_landsat = serie_landsat.map(Normalized_Difference_Moisture_Index);
serie_landsat = serie_landsat.map(Normalized_Difference_Vegetation_Index);
serie_landsat = serie_landsat.map(Soil_Adjusted_Vegetation_Index);
serie_landsat = serie_landsat.map(Enhanced_Vegetation_Index);

print("list all bands names ", serie_landsat.first().bandNames());
print("number of images in IC ", serie_landsat.size());
print("first image showed ", serie_landsat.first());
//===================================================//
//== building and get ROIs from points collected ====//
//===================================================//
print(Fire_2005)
var nFire_2005 = Fire_2005.first().set('ids', 1);                                
var nvegetation = vegetation.first().set('ids', 2);
var nopen_soil = open_soil.first().set('ids', 3);
var nfire_2013 = fire_2013.first().set('ids', 4);
var nwater = water.first().set('ids', 5);
var nshade = shade.first().set('ids', 6);
var nurban = urban.first().set('ids', 7);
var nfire_2002 = fire_2002.first().set('ids', 8);
                             
var name_ROIs = 'rois_serieLandsat_normalized_ptosV1'                         
var base_points = ee.FeatureCollection([nFire_2005,nvegetation,nopen_soil,
                                        nfire_2013,nwater,nshade,nurban,nfire_2002]);


print("history of featureCollection ", base_points.aggregate_histogram('class'));

var all_rois = function_of_collected(serie_landsat, base_points, export_original)


