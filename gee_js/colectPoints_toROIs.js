var function_of_collected = function (img_col, feat_rois, export_orig){

    var ls_ids = img_col.reduceColumns(ee.Reducer.toList(), ['system:index']).get('list');

    ee.List(ls_ids).evaluate(function(list_ids){
        
        var rois_merg = ee.FeatureCollection([]);

        list_ids.forEach(function(idimg){
          
            var img = img_col.filter(ee.Filter.eq('system:index', idimg)).first()

            var pmt_red = {
                collection: feat_rois, 
                properties: ['class', 'year'], 
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
            

        name_ROIs = 'rois_serieLandsat_indexs' 
        
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
                    
        
    });                
}

var param =  {
    asset_serie: 'users/sdoutorado/serie_indexs_withDif_inLandsat',    
    asset_polg_fire: 'users/SarahMoura/Doutorado/areaArdida/AA_nut3_',
    asset_limit : 'users/SarahMoura/Doutorado/bufferNut3',
    asset_output: 'users/sdoutorado/ROIs',
     
    serie_landsat: null,
    serie_landsat_year: null,
    limite_est: null,
    year_selected: 2020,
    number_bnd: 1
};

//=====================================================================//
//== GET IMAGES COLLECTIONS NORMALIZES AND CALCULATE SPECTRALS INDEX ==//
//=====================================================================//
// image collection sorted by date system
var serie_landsat = ee.ImageCollection(param.asset_serie).sort("system:index");

print("list all bands names ", serie_landsat.first().bandNames());
print("number of images in IC ", serie_landsat.size());
print("first image showed ", serie_landsat.first());
//===================================================//
//== building and get ROIs from points collected ====//
//===================================================//

var base_points = Fire_2005.merge(vegetation).merge(open_soil).merge(
                    fire_2013).merge(water).merge(shade).merge(urban).merge(fire_2002)



print("history of featureCollection ", base_points.aggregate_histogram('class'));

var all_rois = function_of_collected(serie_landsat, base_points)

var name_ROIs = 'rois_serieLandsat_normalized'


