var path_ref = 'users/SarahMoura/Doutorado/imgReference/Imgref/'
var params = {
    'CC': 50,
    mes0 : '-08-01',    
    mes1 : '-12-31', 
    asset_l8_ref: path_ref + 'img_refence_L8',
    asset_l7_ref:  path_ref + 'img_refence_L7',
    asset_l5_ref:  path_ref + 'img_refence_L5', 
    asset_output: 'users/SarahMoura/Doutorado/Dados/series/',
    sBTOA : {
        'L8' : ["B2","B3","B4","B5","B6","B7","B10",'pixel_qa'],
        'L7' : ["B1","B2","B3","B4","B5","B6","B7",'pixel_qa'],
        'L5' : ["B1", "B2", "B3","B4","B5","B6","B7",'pixel_qa']              
    },
    sBnTOA : {
        'L8' : ['blue','green','red','nir','swir1','swir2','temp','pixel_qa'],
        'L7' : ['blue','green','red','nir','swir1','temp','swir2','pixel_qa'],
        'L5' : ['blue','green','red','nir','swir1','temp','swir2','pixel_qa']
    },
    // ano: ['2001','2002','2003','2004','2005','2006','2007','2008','2009',
    //       '2010','2011','2012','2013','2014','2015','2016','2017','2018','2019','2020'],   
    ano: ['2001','2002','2003','2004'],
    bnd: ["blue","green","red","nir","swir1",'swir2'],
    bnd_int: ['blue','red', 'nir', 'swir1', 'swir2'],
    'geometry': null,
    'pais': 'Portugal',
    'id_Landsat': {
        'L5': 'LANDSAT/LT05/C01/T1_SR',
        'L7': 'LANDSAT/LE07/C01/T1_SR',
        'L8': 'LANDSAT/LC08/C01/T1_SR' 
    },
    'sensor': ['L5', 'L7','L8'],
    'option' : {                
                '2001': 'L7',
                '2002': 'L7',
                '2003': 'L7',
                '2004': 'L5',
                '2005': 'L5', 
                '2006': 'L5', 
                '2007': 'L5', 
                '2008': 'L5', 
                '2009': 'L5', 
                '2010': 'L5', 
                '2011': 'L5', 
                '2012': 'L5', 
                '2013': 'L5',
                '2014': 'L5',                         
                '2015': 'L8',
                '2016': 'L8',
                '2017': 'L8',
                '2018': 'L8',
                '2019': 'L8',
                '2020': 'L8'
    },
    'cloudThresh' : 5,
    'dilatePixels' : 1,
    'cloudHeights' : ee.List.sequence(100, 5000, 250),
    'zScoreThresh' : 0.7,
    'shadowSumThresh' : 0.45
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
            [-8.856713891601558, 41.82804740180503],
            [-8.864620197682527, 41.78452101001298],
            [-8.863580346679683, 41.72819720386729],
            [-8.825106990778057, 41.6774262267833],
            [-8.80796206054687, 41.62305889051535],
            [-8.79113532368953, 41.57142789110097],
            [-8.775689721679683, 41.51517818560193],
            [-8.770192627250351, 41.471430770057445],
            [-8.772937158271498, 41.42665434625497],
            [-8.763330102539058, 41.3896048792419],
            [-8.737220530545668, 41.33185929475375],
            [-8.724877954101558, 41.274110510940275],
            [-8.724277905008904, 41.24362768819951],
            [-8.715090159410536, 41.22449473116157],
            [-8.709071891820756, 41.19836276597883],
            [-8.681599124316575, 41.164697391141566],
            [-8.668209959529033, 41.132774340439745],
            [-8.65690004882812, 41.09919159381749],
            [-8.655535734393553, 41.07200750346507],
            [-8.650726483032365, 41.04870860992769],
            [-8.644540429687495, 41.02386132485974],
            [-8.213327050781245, 40.95181575345414],
            [-7.702462792968745, 40.877095614588264],
            [-7.241037011718745, 40.81060682841296],
            [-7.026803613281245, 41.4724899566634],
            [-6.801583886718745, 42.099158783412456],
            [-6.719186425781245, 42.35135776156134],
            [-7.199610633643909, 42.43547475903729],
            [-7.960641503906245, 42.537821875300416],
            [-8.685739160156245, 42.64700967440985],
            [-8.526437402343745, 42.33917778318377],
            [-8.69809877929687, 42.228943367030475],
            [-8.791035444499853, 42.18509546390542],
            [-8.80700030623604, 42.11421448533223],
            [-8.884179711914058, 42.09763032158176],
            [-8.873582629590189, 41.99430099377051],
            [-8.873229192461045, 41.92612124679783],
            [-8.86014711914062, 41.83981435403438]
    ]]),
};

////////////////////////////////////////////////////////////////////////////////
// Function for acquiring Landsat TOA image collection                        //
////////////////////////////////////////////////////////////////////////////////

function getImageCollection (year, params, sensor, camino, fila){
    
    //print (sensor)
    var ls;       
    var out;
    var startDate = ee.Date(String(year).concat(params.mes0))
    var endDate = ee.Date(String(year).concat(params.mes1))
    
    if ( sensor == 'L5' ){
        
        var l5TOAs = ee.ImageCollection(params.id_Landsat[sensor])
                        .filterDate(startDate, endDate)
                        .filterMetadata('WRS_PATH', 'equals', parseInt(camino))
                        .filterMetadata('WRS_ROW', 'equals', parseInt(fila))
                        .filterMetadata('CLOUD_COVER_LAND', 'less_than', params.CC)
                        .select(params.sBTOA.L5, params.sBnTOA.L5);

        return l5TOAs
    }
    else if ( sensor == 'L8' ){    
        
        var l8TOAs = ee.ImageCollection(params.id_Landsat[sensor])
                        .filterDate(startDate, endDate)
                        .filterMetadata('WRS_PATH', 'equals', parseInt(camino))
                        .filterMetadata('WRS_ROW', 'equals', parseInt(fila))
                        .filterMetadata('CLOUD_COVER_LAND', 'less_than', params.CC)
                        .select(params.sBTOA.L8, params.sBnTOA.L8);
        
        return l8TOAs
    
    }
    else if ( sensor == 'L7' ){
        
        var l7TOAs = ee.ImageCollection(params.id_Landsat[sensor])
                        .filterDate(startDate, endDate)
                        .filterMetadata('WRS_PATH', 'equals', parseInt(camino))
                        .filterMetadata('WRS_ROW', 'equals', parseInt(fila))
                        .filterMetadata('CLOUD_COVER_LAND', 'less_than', params.CC)
                        .select(params.sBTOA.L7, params.sBnTOA.L7);
        
        return l7TOAs;
    }    
    else{
        return "zero imagem";
    }    
    
    
}
////////////////////////////////////////////////////////////////////////////////
// Border Remove Function                                                     //
////////////////////////////////////////////////////////////////////////////////

var borderRemove = function (image){
    
    var polygon = image.geometry();

    return image.clip(
        polygon.buffer(-500.0)
    );
};
///////////////////////////////////////////////////////////////////////
// A helper to apply an expression and linearly rescale the output.  //
// Used in the landsatCloudScore function below.                     //
///////////////////////////////////////////////////////////////////////


///////////////////////////////////////////////////////////////////////////
// Compute a cloud score and adds a band that represents the cloud mask. // 
// This expects the input image to have the common band names:           //
// ["red", "blue", etc], so it can work across sensors.                  //
///////////////////////////////////////////////////////////////////////////

var cloudScore = function (image) {

    var irSumThresh =0.35;
    var cloudThresh = 20;
    var dilatePixels = 2; //Pixels to dilate around clouds
    var contractPixels = 1;
    
   // Compute several indicators of cloudyness and take the minimum of them.
    var score = ee.Image(1.0);
    // Clouds are reasonably bright in the blue band.
    score = score.min(rescale(img, 'img.blue', [0.1, 0.3]));
  
    // Clouds are reasonably bright in all visible bands.
    score = score.min(rescale(img, 'img.red + img.green + img.blue', [0.2, 0.8]));
  
    // Clouds are reasonably bright in all infrared bands.
    score = score.min(
        rescale(img, 'img.nir + img.swir1 + img.swir2', [0.3, 0.8]));
  
    // Clouds are reasonably cool in temperature.
    score = score.min(rescale(img, 'img.temp', [300, 290]));
  
    // However, clouds are not snow.
    var ndsi = img.normalizedDifference(['green', 'swir1']);
    
    score =  score.min(rescale(ndsi, 'img', [0.8, 0.6]));
    
    score = score.multiply(100).byte();
    score = score.gt(cloudThresh)
                      .focal_min(contractPixels)
                      .focal_max(dilatePixels)
    
    var darkPixels = img.select(['nir','swir1','swir2'])
                            .reduce(ee.Reducer.sum()).lt(irSumThresh)
                            .focal_min(contractPixels).focal_max(dilatePixels)
    var cloudShadowMask = darkPixels.or(score);
    
    return img.updateMask(cloudShadowMask.not());
    
};
  
////////////////////////////////////////////////////////////////////////////
// Function for finding dark outliers in time series.                     //
// Original concept written by Carson Stam and adapted by Ian Housman.    //
// Adds a band that is a mask of pixels that are dark, and dark outliers. //
////////////////////////////////////////////////////////////////////////////

var cloudProject =  function(img){
        
        var cloudHeights = ee.List.sequence(0, 3000,300);
        //print("alturas das nuvens");
        // var shadowSumThresh = 2000;        
        var dilatePixels = 2;
        
        // Get the cloud mask
        var cloud = img.select('cloudMask');//.Not()
        cloud = cloud.focal_min(dilatePixels - 1, "circle").focal_max(dilatePixels,"circle");
        // cloud = cloud.updateMask(cloud);
        // Get scale of image
        var nominalScale = cloud.projection().nominalScale();
        // Find where cloud shadows should be based on solar geometry
        // Convert to radians
        var meanAzimuth = img.get('SOLAR_AZIMUTH_ANGLE');
        var meanZenith = img.get('SOLAR_ZENITH_ANGLE');

        var azR = ee.Number(meanAzimuth).multiply(Math.PI).divide(180.0)
                              .add(ee.Number(0.5).multiply(Math.PI));
                              
        var zenR = ee.Number(0.5).multiply(Math.PI).subtract(
                                ee.Number(meanZenith).multiply(Math.PI).divide(180.0));
        
        var shadows = cloudHeights.map(function(cloudH){
            
            var cloudHeight = ee.Number(cloudH);
            var shadowCastedDistance = zenR.tan().multiply(cloudHeight); //Distance shadow is cast
            // X distance of shadow
            var x = azR.cos().multiply(shadowCastedDistance).divide(nominalScale).round(); 
            //Y distance of shadow
            var y = azR.sin().multiply(shadowCastedDistance).divide(nominalScale).round(); 
            
            return cloud.changeProj(cloud.projection(), cloud.projection().translate(x, y));
        });
        
        var shadow = ee.ImageCollection.fromImages(shadows).max();

        // // Create shadow mask
        shadow = shadow.add(cloud)
        // shadow = shadow.focal_max(dilatePixels, "circle");
        // shadow = shadow.mask().and(darkPixels) //.and(TDOMMask))

        // // Combine the cloud and shadow masks
        // var combinedMask = cloud.mask().or(shadow.mask()).eq(0)
        var Mask = shadow.eq(0);
        // //Update the image's mask and return the image
        // img = img.updateMask(img.mask().and(combinedMask))
        //img = img.addBands(combinedMask.rename(['cloudShadowMask']))
        //Map.addLayer(Mask)
        return img.updateMask(Mask);

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
  return ee.Image(image).updateMask(cloud.not()).updateMask(mask2);

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
  return image.updateMask(mask);
}

var getFC = function (image, band, AOI) {
    
    // Histogram equalization start:
    var histo = image.reduceRegion({
        reducer: ee.Reducer.histogram({maxBuckets: Math.pow(2, 12)}), 
        geometry: AOI, 
        scale: 30, 
        maxPixels: 1e11, 
        tileScale: 6
    });
    
    var valsList = ee.List(ee.Dictionary(histo.get(band)).get('bucketMeans'));
    var freqsList = ee.List(ee.Dictionary(histo.get(band)).get('histogram'));
    var cdfArray = ee.Array(freqsList).accum(0);
    var total = cdfArray.get([-1]);
    var normalizedCdf = cdfArray.divide(total);
    
    
    var lists = valsList.zip(normalizedCdf.toList());
    return lists.reduce(ee.Reducer.toCollection(['dn', 'probability']));
  }
  

function equalize(image1, image2, band) {
  
    var geom1 = image1.geometry()
    var geom2 = image2.geometry()
    var fc1 = getFC(image1, band, geom1);
    var fc2 = getFC(image2, band, geom2);
        
    var classifier1 = ee.Classifier.smileCart()
                            .setOutputMode('REGRESSION')
                            .train({
                                features: fc1, 
                                classProperty: 'dn', 
                                inputProperties: ['probability']
                            });
    
                            
    var classifier2 = ee.Classifier.smileCart()
                                .setOutputMode('REGRESSION')
                                .train({
                                    features: fc2, 
                                    classProperty: 'probability', 
                                    inputProperties: ['dn']
                                });

    // Do the shuffle: DN -> probability -> DN. Return the result.
    var b = image2.select(band).rename('dn');
    return b
            .classify(classifier2, 'probability') // DN -> probability
            .classify(classifier1, band); // probability -> DN
}

var matchHistogram = function(image1) {
    
    return ee.Image.cat(params.bnd.map(
                  function(band) {
                          return equalize(image1, image2, band);
                  }));
}



var parametros = {
    vis:{
        bands:["red","green","blue"], 
        min: 50 ,
        max: 3500
    }
}
var imgExport = function(img,  name, geom){
    
    var idAssets = params.asset_output + name;

    var opt = {
        image: img, 
        description: name, 
        assetId: idAssets, 
        region: geom,
        pyramidingPolicy: {".default": 'mode'},
        scale: 30, 
        maxPixels: 1e13
    };

    Export.image.toAsset(opt);
    print("salvo em ", idAssets)
}
var noSensor = 0;

var path_wrs = 204;
var row_wrs = 31;

print("procesando wrsPath: " + path_wrs.toString() + " e  wrsRow: " + row_wrs.toString() )

params.ano.forEach(function(ano){
    
    print("sensor <==> " + params.option[ano]);
    
    var ICwork = getImageCollection(ano, params, params.option[ano], path_wrs, row_wrs);
    
    print("ano <==> " + ano.toString());
    var date_inic = ano + params.mes0;  
    var date_end = ano + params.mes1;

    ICwork = ICwork.filterDate(date_inic, date_end);
    var tamanho = ICwork.size().getInfo();
    print("quantidade de imagens", tamanho);
    print("imageCollection", ICwork) 

    var geom = geom_landsat.tolimit;

    if (tamanho > 1){
        //Map.addLayer(tempImg, parametros ,"imgCol_"+ ano)
        // tempImg = borderRemove(tempImg)

        var img_ref = ee.Image();

        switch (params.option[ano]) {
            case 'L5':
                print("path landsat reference ", params.asset_l5_ref)
                img_ref = ee.Image(params.asset_l5_ref);            
                break;
            case 'L7':
                print("path landsat reference ", params.asset_l7_ref)
                img_ref = ee.Image(params.asset_l7_ref)
                break;
            case 'L8':
                print("path landsat reference ", params.asset_l8_ref)
                img_ref = ee.Image(params.asset_l8_ref);         
                break;            
        }
        print("image Referecnia ", img_ref)
        
        if (params.option[ano] === 'L8'){
            print('entrou in L8');
            ICwork = ICwork.map(maskL8sr);
        
        }else{            
            ICwork = ICwork.map(cloudMaskL457)
        } 
        
        ICwork = ee.ImageCollection(ICwork).select(params.bnd_int);
        img_ref = img_ref.select(params.bnd_int);
        
        var ICworkMatch = ICwork.map(function(image1) {

            var img_tmp = ee.Image.cat(params.bnd_int.map(
                        function(band) {
                                return equalize(img_ref, image1, band);
                        }));
            
            return img_tmp.select(params.bnd_int);

        });
    
        print("imageCollection", ICwork);
        
        var ls_ids = ICwork.reduceColumns(ee.Reducer.toList(), ['system:index']).get('list');

        ee.List(ls_ids).evaluate(function(lista_index){
            lista_index.forEach(function(ids){
                var img_tmp = ICwork.filter(ee.Filter.eq('system:index', ids)).first();
                img_tmp = img_tmp.clip(geom);
                img_tmp = img_tmp.set('system:footprint', geom);
                var name = ids + '_norm' 

                imgExport(img_tmp, name, geom)

            })
        });        

    };    
})