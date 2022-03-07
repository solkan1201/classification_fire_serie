
//Coleção landsat Index 
var params = {
    'asset_inputH': 'users/shdoutorado/serieHarmonica',
    'asset_inputS': 'users/sdoutorado/serie_indexs_withDif_inLandsat', 
    'asset_polg_fire': 'users/SarahMoura/Doutorado/areaArdida/AA_nut3_',
    'bnd_int': ['nir', 'nbr', 'mirbi','dNBR']    
}

var limiar_mask = -0.2;
var indexAnalise = 'nbr';
var bandFited = indexAnalise + '_fitted' ;
var imgColSerie = ee.ImageCollection(params.asset_inputS).sort('system:time_start');
var imgColHarmo = ee.ImageCollection(params.asset_inputH).sort('system:time_start');
var geome = imgColSerie.geometry();
var size_imgC = imgColSerie.size();
print("tamanho image collection ", size_imgC)

imgColSerie = imgColSerie.map(function(img){
                        var ids = img.id()
                        var imgH = imgColHarmo.filter(ee.Filter.eq('system:index', ids)).first()
                        var ruido  = img.select(indexAnalise).subtract(imgH.select(bandFited)).rename('ruido')
                        return img.addBands(imgH).addBands(ruido.lt(limiar_mask));
                    })



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
        palette :'FF0000'
    },
    vis_l8: { 
        min: 40, 
        max: 3500, 
        bands: ['swir1','nir', 'red'] 
    },
   
}

var styles = {
    mapas: {
        height: '800px',
        border: '2px solid black'
    },    
    panel_head: {
        'width': '700px',
        'height': '70px',
        'position': 'top-right',
        // 'backgroundColor': '#cccccc',
        'margin': '0px 0px 0px 1px',
    },
    panel_selected: {
        'width': '100px',
        'height': '40px',
        'stretch': 'vertical',
        'position': 'middle-right',
        'margin': '0px 0px 0px 0px',
    },
    panel_ploting: {
        width: '800px',
        height: "600px",
        position: 'bottom-right'
    },
    labelTitulo : {
        fontSize: '18px', 
        fontWeight: 'bold',
        backgroundColor: '#F5F4F9'
    },
    labelInsp: {
        fontSize: '18px', 
        fontWeight: 'bold',
        backgroundColor: '#F5F4F9'
    },
    

};


// Create a panel to hold our widgets.
var panelPlot = ui.Panel();
panelPlot.style().set(styles.panel_ploting);
  
// Create an intro panel with labels.
var titulo =  ui.Label({
        value: 'Sistem of fire classification',
        style: styles.labelTitulo
      })

var accion = ui.Label(' (Click into map to inpects) ')

var panelHead = ui.Panel({
    layout: ui.Panel.Layout.flow('horizontal'),
    style: styles.panel_head
});
panelHead.add(titulo);
panelHead.add(accion);


panelPlot.add(panelHead);
Map.add(panelPlot);
// Create panels to hold lon/lat values.
var lon = ui.Label();
var lat = ui.Label();
panelPlot.add(ui.Panel([lon, lat], ui.Panel.Layout.flow('horizontal')));


// Register a callback on the default map to be invoked when the map is clicked.

Map.onClick(function(coords) {
    // Update the lon/lat panel with values from the click event.
    lon.setValue('lon: ' + coords.lon.toFixed(2)),
    lat.setValue('lat: ' + coords.lat.toFixed(2));

    // Add a red dot for the point clicked on.
    var point = ee.Geometry.Point(coords.lon, coords.lat);
    var dot = ui.Map.Layer(point, {color: 'FF0000'});
    Map.layers().set(1, dot);     
    
    ////////////////////////////////////////////////////////////////////////////////
    // Plot the fitted model and the original data at the ROI- Modis.
    
    var indChartHarmonic= ui.Chart.image.series(
            imgColSerie.select([bandFited,indexAnalise]), point, ee.Reducer.mean(), 30)
                .setSeriesNames([ indexAnalise, 'estimado'])
                .setOptions({
                    trendlines: {0: {
                            color: 'CC0000'
                            }},
                            title: 'Índices para resaltar Fogo',
                            lineWidth: 1,
                            //max: 750,
                            pointSize: 3,
                });
    panelPlot.widgets().set(2, indChartHarmonic);
   
    var indChartRuido = ui.Chart.image.series(
        imgColSerie.select(['ruido']), point, ee.Reducer.mean(), 30)
            .setSeriesNames(['ruido'])
            .setChartType('ColumnChart')
            
    panelPlot.widgets().set(3, indChartRuido);
});
  
Map.style().set('cursor', 'crosshair');
var yearCorrunt = '2017'
var data_inic = yearCorrunt + '-01-01'
var data_final = yearCorrunt + '-02-15'

var imgColFilted = imgColSerie.filterDate(data_inic, data_final)
var lsIndexSys = imgColFilted.reduceColumns(ee.Reducer.toList(), ['system:index']).get('list').getInfo()

lsIndexSys.forEach(function(nameSys){
    print(nameSys);
    var strId = nameSys.slice(0, -7);
    print(strId)
    var patronl8 = ee.String(strId).index('LC08');
    var patronl7 = ee.String(strId).index('LE07');
    print("patron ", patronl8)
    var bands_L57 = ["B1","B3","B4","B5","B7"];
    var bands_L8 = ["B2","B4","B5","B6","B7"];
    var bnds_name = ["blue","red","nir","swir1","swir2"];            
    var img_new =  ee.Algorithms.If(
                      ee.Algorithms.IsEqual(patronl8, -1),
                      ee.Algorithms.If(
                          ee.Algorithms.IsEqual(patronl7, -1),
                          ee.Image('LANDSAT/LT05/C01/T1_SR/' + strId).select(bands_L57, bnds_name),
                          ee.Image('LANDSAT/LE07/C01/T1_SR/' + strId).select(bands_L57, bnds_name)
                        ),
                      ee.Image('LANDSAT/LC08/C01/T1_SR/'  + strId).select(bands_L8, bnds_name)
                );
    print(img_new)
    Map.addLayer(ee.Image(img_new), vis.vis_l8, nameSys)
  
    var imgTemp = imgColSerie.filter(ee.Filter.eq('system:index', nameSys)).first();

    Map.addLayer(imgTemp.select(indexAnalise), vis[indexAnalise], 'NBR' , false);
    var manchaFire = imgTemp.select('ruido')
    Map.addLayer(manchaFire.selfMask(), vis.ruido, 'manchaAlertaFire');

    
})

 
// Map.addLayer(imgColFilted.select(bandFited), vis[indexAnalise], bandFited, false) 

var feat_fire  = ee.FeatureCollection(params.asset_polg_fire + yearCorrunt)
var layer_vect = ee.Image().byte().paint(feat_fire, 1, 1.5);
Map.addLayer(layer_vect, {palette: '00AF00'}, 'fire_' + yearCorrunt);
// Add the panel to the ui.root.
// ui.root.insert(0, panel);

Map.setCenter(-7.8456, 41.0517, 10)
  
   