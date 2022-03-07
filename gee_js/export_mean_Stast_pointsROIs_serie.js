//https://code.earthengine.google.com/eb4b248f534deb3c5ba6d69da82102ce
var name_ROIs = 'rois_serieLandsat_normalized'
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


var function_of_collected = function (img_col, feat_rois, export_orig, name_rois){

        var ls_ids = img_col.reduceColumns(ee.Reducer.toList(), ['system:index']).get('list');

        ee.List(ls_ids).evaluate(function(list_ids){
            
            var ls_bnd = ['bai','baiml','baims','blue','evi','mirbi','nbr',
                                'nbr2','ndmi','ndvi','nir','red','savi','swir1','swir2'];
            var ls_bnd_mean = [];
            var ls_bnd_median = []; 
            var ls_bnd_stdDev = [];
            
            ls_bnd.forEach(function(bnd){
                ls_bnd_mean.push('mean-' + bnd);
                ls_bnd_median.push('median-' + bnd);
                ls_bnd_stdDev.push('stdDev-' + bnd);
            })

            var rois_merg = ee.List([]);


            list_ids.forEach(function(idimg){
              
                var img = img_col.filter(ee.Filter.eq('system:index', idimg)).first();            

                //reduceRegions(collection, reducer, scale, crs, crsTransform, tileScale)
                var pmt_red = {                    
                    reducer: ee.Reducer.minMax(), 
                    geometry: feat_rois.geometry(), 
                    scale: 30, 
                    tileScale: 2                   
                };
                //reduceRegion(reducer, geometry, scale, crs, crsTransform, bestEffort, maxPixels, tileScale)
                //ee.Reducer.median, ee.Reducer.mean, ee.Reducer.minMax(),ee.Reducer.stdDev()
                var dict_reducer = img.reduceRegion(pmt_red);               
                var feat_tmp = ee.Feature(feat_rois.first().geometry(), dict_reducer);               

                // collected others informations
                feat_tmp = feat_tmp.set('id_system', img.id(), 'name_rois', name_rois);
                
                ///========== MEAN =====================///
                img = img.select(ls_bnd, ls_bnd_mean);                
                pmt_red.reducer = ee.Reducer.mean() ;
                dict_reducer = img.reduceRegion(pmt_red);
                feat_tmp = feat_tmp.set(dict_reducer);

                ///========== MEDIAN =====================///
                img = img.select(ls_bnd_mean, ls_bnd_median);                
                pmt_red.reducer = ee.Reducer.median() ;
                dict_reducer = img.reduceRegion(pmt_red);
                feat_tmp = feat_tmp.set(dict_reducer);
                
                ///========== STD DEV=====================///
                img = img.select(ls_bnd_median, ls_bnd_stdDev);                
                pmt_red.reducer = ee.Reducer.stdDev() ;
                dict_reducer = img.reduceRegion(pmt_red);
                feat_tmp = feat_tmp.set(dict_reducer);
                
                ///==== added to list o feature building ===/////
                rois_merg = rois_merg.add(feat_tmp);

            })

            rois_merg = ee.FeatureCollection(rois_merg);
                
            if(export_orig=== true){  name_ROIs = 'rois_serieLandsat_real' }

            var nname_rois = name_ROIs + "_" + name_rois;
            var optExp = {
                'collection': rois_merg, 
                'description': nname_rois, 
                'assetId':  param.asset_output + name_ROIs        
            }
            Export.table.toAsset(optExp)
            optExp = {
                'collection': rois_merg, 
                'description': nname_rois, 
                'folder':  'CSV_ROIs'        
            }
            Export.table.toDrive(optExp)
                        
            print(name_rois, rois_merg.limit(4))
            print(name_rois, rois_merg.size())
        });                
}

var get_landsatCollection = function (img){
  
            var id_l = img.id();
            // print("id da image ", id_l)
            var strId = ee.String(id_l).slice(2, -7);

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
    asset_serie: 'users/SarahMoura/Doutorado/Dados/series',
    asset_seriev2: 'users/SarahMoura/Doutorado/Dados/serie2',
    asset_polg_fire: 'users/SarahMoura/Doutorado/areaArdida/AA_nut3_',
    asset_limit : 'users/SarahMoura/Doutorado/bufferNut3',
    asset_output: 'users/SarahMoura/Doutorado/PONTOS/',
     
    serie_landsat: null,
    serie_landsat_year: null,
    limite_est: null,
    year_selected: 2020,
    number_bnd: 1
};

var export_original = false
//=====================================================================//
//== GET IMAGES COLLECTIONS NORMALIZES AND CALCULATE SPECTRALS INDEX ==//
//=====================================================================//

var serie_landsat = ee.ImageCollection(param.asset_serie).merge(
                        ee.ImageCollection(param.asset_seriev2)).sort("system:index");
            
var ls_ind = serie_landsat.reduceColumns(ee.Reducer.toList(), ['system:index']).get('list')
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
var nFire_2005 = Fire_2005.map(function(feat){
                                    return feat.set('ids', 1);
                                });
var nvegetation = vegetation.map(function(feat){
                                    return feat.set('ids', 2);
                                });
var nopen_soil = open_soil.map(function(feat){
                                    return feat.set('ids', 3);
                                });
var nfire_2013 = fire_2013.map(function(feat){
                                    return feat.set('ids', 4);
                                });
var nwater = water.map(function(feat){
                                    return feat.set('ids', 5);
                                });
var nshade = shade.map(function(feat){
                                    return feat.set('ids', 6);
                                });
var nurban = urban.map(function(feat){
                                    return feat.set('ids', 7);
                                });
var nfire_2002 = fire_2002.map(function(feat){
                                    return feat.set('ids', 8);
                                });
                                
                            
var list_base_points = [nFire_2005, nvegetation, nopen_soil, nfire_2013,
                        nwater, nshade, nurban, nfire_2002];


var ls_name_ROIs = ['fire_2005', 'vegetation','open_soil','fire_2013',
                    'water','shade','urban','fire_2002'];

var cont = 0;
list_base_points.forEach(function(featC){
    
    print(ee.String(ls_name_ROIs[cont]).cat(featC.size()));

    var all_rois = function_of_collected(serie_landsat, featC, export_original, ls_name_ROIs[cont]);
    cont += 1;

})







// var base_points = nFire_2005.merge(nvegetation).merge(nopen_soil).merge(
//     nfire_2013).merge(nwater).merge(nshade).merge(nurban).merge(nfire_2002);

//     print("history of featureCollection ", base_points.aggregate_histogram('class'));