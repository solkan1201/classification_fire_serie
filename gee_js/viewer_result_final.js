
//Coleção landsat Index 

// Register a function to draw a chart when a user clicks on the map.
var Normalized_Burn_Ratio = function(img){
    var nbrImg = img.expression(
        "float((b('nir') - b('swir2')) / (b('nir') + b('swir2')))").rename(['nbr']);     
    
    return img.addBands(nbrImg);
}
var set_date = function(img){
    var dat = img.id(); //'LE07_204031_20020427_fire'
    dat = ee.String(dat);
    var fecha = dat.slice(12, 16).cat('-').cat(dat.slice(16, 18)).cat('-').cat(dat.slice(18, 20));
    fecha = ee.Date(fecha);
    return img.set('system:time_start', fecha)
};

var params = {    
    asset_inputS: 'users/sdoutorado/serieManchasFire/', 
    asset_polg_fire: 'users/SarahMoura/Doutorado/areaArdida/AA_nut3_',
    asset_class_fire: 'users/sdoutorado/fireClass',
    limitPort: 'users/SarahMoura/Doutorado/limitePT',
    bnd_int: ['nir', 'nbr', 'mirbi','dNBR'],
    lst_year: ['2001','2002','2003','2004','2005','2006','2007','2008','2009',
               '2010','2011','2012','2013','2014','2015','2016','2017','2018',
               '2019','2020']     
}

var dictMesDay = {
    'janeiro': {
        '0': '-01-01',
        '1': '-02-01'
    },
    "fevereiro":  {
        '0': '-02-01',
        '1': '-03-01'
    },
    "março": {
        '0': '-03-01',
        '1': '-04-01'
    },
    "abril":  {
        '0': '-03-01',
        '1': '-04-01'
    },
    "maio":  {
        '0': '-04-01',
        '1': '-05-01'
    },
    "junho": {
        '0': '-05-01',
        '1': '-06-01'
    },
    "julho": {
        '0': '-06-01',
        '1': '-07-01'
    },
    "agosto": {
        '0': '-07-01',
        '1': '-08-01'
    },
    "setembro": {
        '0': '-08-01',
        '1': '-09-01'
    },
    "outubro": {
        '0': '-09-01',
        '1': '-10-01'
    },
    "novembro": {
        '0': '-10-01',
        '1': '-11-01'
    },
    "dezembro":  {
        '0': '-11-01',
        '1': '-12-01'
    },
}

// var imgColSerie = ee.ImageCollection(params.asset_inputS).sort('system:time_start');
var imgColClass = ee.ImageCollection(params.asset_class_fire).map(set_date);
imgColClass = imgColClass.sort('system:time_start');
print(imgColClass)
var limit_port = ee.FeatureCollection(params.limitPort);
// var geome = imgColSerie.geometry();
var size_imgC = imgColClass.size();
print("tamanho image collection ", size_imgC)
var imgLandsat = null;

var year_selected = '2020';
var mes_start_selected = 'janeiro'
var mes_end_selected = 'janeiro'
var lst_indexImage = []
var indexImage = '';
var date_start = '2020-01-01'
var date_end = '2020-02-01'
var visualizado = false;


var AtualizarAlistaImagensFiltered = function(){
                                var listCol = imgColClass.filterDate(date_start, date_end);
                                var lstInd = listCol.reduceColumns(ee.Reducer.toList(), ['system:index']).get('list')
                                lst_indexImage = lstInd.getInfo();
                                print("length of list images ", lst_indexImage.length)
                            }

var generate_date_range = function(){
    date_start = year_selected + dictMesDay[mes_start_selected]['0'];
    date_start = ee.Date(date_start);

    date_end = year_selected + dictMesDay[mes_end_selected]['1'];
    date_end = ee.Date(date_end);

    var date_dif = date_end.difference(date_start, 'month');

    date_end = ee.Algorithms.If( 
                        ee.Algorithms.IsEqual(ee.Number(date_dif).gt(0), 1),
                        date_end,
                        date_end.advance(1, 'year')
                    )

    print("Dates of start = ", date_start);
    print("Dates of ended = ", date_end);
}


var visualizarImage_selected = function(){

    var img_class_fire = imgColClass.filter(ee.Filter.eq('system:index', indexImage)).first();    

    var strId = indexImage.slice(0, -5);
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
    var index_mancha = strId + '_normal' ;

    var img_mancha_fire = ee.Image(params.asset_inputS + index_mancha);

    if (visualizado === true){
        for (var ii = 3 ; ii >= 0; ii--) {
            print("removendo camada", ii);
            var camada = Map.layers().get(ii);
            print(camada)
            Map.remove(camada);            
        }
    }
    Map.addLayer(ee.Image(imgLandsat), vis.vis_l8, strId);
    Map.addLayer(imgLandsat.select('nbr'), vis.nbr, 'NBR', false);
    Map.addLayer(img_mancha_fire.selfMask(), vis.ruido, "mancha Fire");
    Map.addLayer(img_class_fire.selfMask(), vis.mask, "class Fire");
    Map.setCenter(-7.9417, 41.5773, 12);
    visualizado = true
    print(Map.layers())
}



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
        palette :'000000, 8E1F20'
    },
    mask: {
        min: 0, 
        max: 1, 
        palette :'000000, ECC846'
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
        'width': '270px',
        'height': '500px',
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
    }
};



// Create a panel to hold our widgets.
var panelPlot = ui.Panel();
panelPlot.style().set(styles.panel_ploting);
  
// Create an intro panel with labels.
var titulo =  ui.Label({
        value: 'Sistem of colect ROIs of fire',
        style: styles.labelTitulo
      })



var year_select_start = ui.Select({
    placeholder: 'Select a year',
    items: params.lst_year,
    onChange: function(year){
        // bacia_focused = mcpio;
        print("selected year ===> " + year);
        year_selected = year; 
    },
    style: styles.select_mps
})

var month_select_start = ui.Select({ 
    items: [
        { label: "janeiro", value: 'janeiro' },
        { label: "fevereiro", value: 'fevereiro' },
        { label: "março", value: 'março' },
        { label: "abril", value: 'abril' },
        { label: "maio", value: 'maio'},
        { label: "junho", value: 'junho'},
        { label: "julho", value: 'julho'},
        { label: "agosto", value: 'agosto'},
        { label: "setembro", value: 'setembro'},
        { label: "outubro", value: 'outubro'},
        { label: "novembro", value: 'novembro'},
        { label: "dezembro", value: 'dezembro'},
    ],
    placeholder: 'seleciona um mês',
    value: 'janeiro',
    onChange: function(value){      
        mes_start_selected = value;
    }
})

var month_select_end = ui.Select({ 
    items: [
        { label: "janeiro", value: 'janeiro' },
        { label: "fevereiro", value: 'fevereiro' },
        { label: "março", value: 'março' },
        { label: "abril", value: 'abril' },
        { label: "maio", value: 'maio'},
        { label: "junho", value: 'junho'},
        { label: "julho", value: 'julho'},
        { label: "agosto", value: 'agosto'},
        { label: "setembro", value: 'setembro'},
        { label: "outubro", value: 'outubro'},
        { label: "novembro", value: 'novembro'},
        { label: "dezembro", value: 'dezembro'},
    ],
    placeholder: 'seleciona um mês',
    value: 'janeiro',
    onChange: function(value){      
        mes_end_selected = value;
        // atualizando as datas para filtrar a serie
        generate_date_range();
        //atualizar a lista de imagens a sere visualizadas 
        AtualizarAlistaImagensFiltered();

        // Asynchronously get the list of band names.
        ee.List(lst_indexImage).evaluate(function(lstIndImg) {
            // Display the bands of the selected image.
            lista_select_images.items().reset(lstIndImg);
            // Set the first band to the selected band.
            lista_select_images.setValue(lista_select_images.items().get(0));
        });
        
       

    }
})
var accion = ui.Label(' (Click into map to inpects) ')

var buttonShow = ui.Button({
    label: 'show classificação',
    onClick: function(){
        visualizarImage_selected();
    }
  });
  

var lista_select_images = ui.Select({
    
    placeholder: 'Select Images Index',
    onChange: function(value){

        indexImage = value;
        print("imagem selecionada == ", value)

        
    }

})

var panelHead = ui.Panel({
    layout: ui.Panel.Layout.flow('vertical'),
    style: styles.panel_head
});
panelHead.add(titulo);
panelHead.add(year_select_start);
panelHead.add(month_select_start);
panelHead.add(month_select_end);
panelHead.add(lista_select_images);
panelHead.add(buttonShow);


// panelPlot.add(panelHead);
Map.add(panelHead);
// Create panels to hold lon/lat values.
// var lon = ui.Label();
// var lat = ui.Label();
// panelPlot.add(ui.Panel([lon, lat], ui.Panel.Layout.flow('horizontal')));

