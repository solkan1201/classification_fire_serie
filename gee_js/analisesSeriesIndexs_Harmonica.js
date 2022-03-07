
//Coleção landsat Index 
var params = {
    'asset_inputH': 'users/sdoutorado/serieHarmonica',
    'asset_inputS': 'users/sdoutorado/serie_indexs_withDif_inLandsat',     
    'bnd_int': ['nir', 'nbr', 'mirbi','dNBR']    
}


var indexAnalise = 'nbr'
var bandFited = indexAnalise + '_fitted' 
var imgColSerie = ee.ImageCollection(params.asset_inputS).sort('system:time_start')
var imgColHarmo = ee.ImageCollection(params.asset_inputH).sort('system:time_start')
var geome = imgColSerie.geometry()
var size_imgC = imgColSerie.size().getInfo()
print("tamanho image collection ", size_imgC)

imgColSerie = imgColSerie.map(function(img){
                        var ids = img.id()
                        var imgH = imgColHarmo.filter(ee.Filter.eq('system:index', ids)).first()

                        return img.addBands(imgH);
                    })



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
        height: "400px",
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

var dict_indices = {
    'NIR': 'nir',
    'NBR': 'nbr',    
    'MIRBI': 'mirbi',    
    'dNBR': 'dNBR'    
};
var ls_variaveis = ['NIR','NBR','MIRBI','dNBR']
var select_Index = ui.Select({
    value: 'NBR',
    items: ls_variaveis,
    onChange: function(key) {
        indexAnalise = dict_indices[key];
        bandFited = indexAnalise + '_fitted'
        print('seleccionado indice', indexAnalise )
    },
    style: styles.panel_selected
});
  
// Create an intro panel with labels.
var titulo =  ui.Label({
        value: 'Sistem of classification of fire',
        style: styles.labelTitulo
      })

var accion = ui.Label(' (Click into map to inpects) ')

var panelHead = ui.Panel({
    layout: ui.Panel.Layout.flow('horizontal'),
    style: styles.panel_head
});
panelHead.add(titulo);
panelHead.add(select_Index);
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
    
    var ndviChartM= ui.Chart.image.series(
            imgColSerie.select([bandFited,indexAnalise]), point, ee.Reducer.mean(), 30)
                .setSeriesNames(['estimado', indexAnalise])
                .setOptions({
                    trendlines: {0: {
                            color: 'CC0000'
                            }},
                            title: 'Índices para resaltar Fogo',
                            lineWidth: 1,
                            //max: 750,
                            pointSize: 3,
                });
    panelPlot.widgets().set(2, ndviChartM);
   
 
});
  
Map.style().set('cursor', 'crosshair');
Map.addLayer(imgColSerie.select(indexAnalise), vis[indexAnalise], indexAnalise) 
Map.addLayer(imgColSerie.select(bandFited), vis[indexAnalise], bandFited) 
// Add the panel to the ui.root.
// ui.root.insert(0, panel);

Map.setCenter(-7.8456, 41.0517, 10)
  
   