 

var application = {}; // object principal
application.dataset = { 
    asset_serie: 'users/SarahMoura/Doutorado/Dados/series',
    //asset_serie: 'users/SarahMoura/Doutorado/Dados/serie2',
    asset_polg_fire: 'users/SarahMoura/Doutorado/areaArdida/AA_nut3_',
    asset_limit : 'users/SarahMoura/Doutorado/bufferNut3',
    lst_year: ['2001','2002','2003','2004','2005','2006','2007','2008','2009',
               '2010','2011','2012','2013','2014','2015','2016','2017','2018','2019','2020'],    
    serie_landsat: null,
    serie_landsat_year: null,
    limite_est: null,
    year_selected: 2020,
    number_bnd: 1
};

application.initUi = function(){
    application.UI.building_ui();
    application.functions.load_layers();
    
};

application.functions = {
    
    load_layers: function(){

        application.dataset.serie_landsat = ee.ImageCollection(application.dataset.asset_serie);
        application.dataset.serie_landsat = application.dataset.serie_landsat.map(
                                                        application.functions.Normalized_Burn_Ratio);
        application.dataset.serie_landsat = application.dataset.serie_landsat.map(
                                                        application.functions.Normalized_Burn_Ratio_2);
        application.dataset.serie_landsat = application.dataset.serie_landsat.map(
                                                        application.functions.Burned_Area_Index);
        application.dataset.serie_landsat = application.dataset.serie_landsat.map(
                                                        application.functions.indice_verde);
        application.dataset.serie_landsat = application.dataset.serie_landsat.map(
                                                        application.functions.Burned_Area_Index_Mod_SWIR1);
        application.dataset.serie_landsat = application.dataset.serie_landsat.map(
                                                        application.functions.Burned_Area_Index_Mod_SWIR2);
        application.dataset.serie_landsat = application.dataset.serie_landsat.map(
                                                        application.functions.Mid_Infrared_Burn_Index);
        application.dataset.serie_landsat = application.dataset.serie_landsat.map(
                                                        application.functions.Normalized_Difference_Moisture_Index);
        application.dataset.serie_landsat = application.dataset.serie_landsat.map(
                                                        application.functions.Normalized_Difference_Vegetation_Index);
        application.dataset.serie_landsat = application.dataset.serie_landsat.map(
                                                        application.functions.Soil_Adjusted_Vegetation_Index);
        application.dataset.serie_landsat = application.dataset.serie_landsat.map(
                                                        application.functions.Enhanced_Vegetation_Index);
                
        application.dataset.limite_est = ee.FeatureCollection(application.dataset.asset_limit);

        var layer_vect = ee.Image().byte().paint(application.dataset.limite_est, 1, 1.5);
        var shp_Layer = ui.Map.Layer({
            'eeObject': layer_vect,
            'visParams': {palette: 'C9878F'},
            'name': 'limit_Estudo',
            'shown': true,
            'opacity': 0.8
        });

        Map.add(shp_Layer);
        Map.setCenter(-8.3154, 41.5058, 10)
    },
    show_imgs_serie_year: function(){
        print(Map.layers())
        if (application.dataset.number_bnd > 1){
            for (var ii = application.dataset.number_bnd ; ii >= 1; ii--) {
                print("removendo camada", ii);
                var camada = Map.layers().get(ii)
                print(camada)
                Map.remove(camada);
                application.dataset.number_bnd = 1;
            }
        }
        
        var myear = application.dataset.year_selected;

        var ls_index = application.dataset.serie_landsat_year.reduceColumns(
                                ee.Reducer.toList(), ['system:index']).get('list');
        print(ls_index.length)
        application.dataset.number_bnd +=  ee.List(ls_index).size().getInfo();
        print("camada ", application.dataset.number_bnd)
        ee.List(ls_index).evaluate(function(lsIndex){
            var cc = 0;
            var visualizar = true;
            lsIndex.forEach(function(name_img){
                print("loading image == " + name_img)
                var img_temp = application.dataset.serie_landsat_year.filter(
                                                ee.Filter.eq('system:index', name_img));
                
                if(cc > 0){  visualizar = false; }
                
                Map.addLayer(img_temp, application.vis.vis_l8, name_img, visualizar);
                cc = cc + 1;                
            })

            var feat_fire  = ee.FeatureCollection(application.dataset.asset_polg_fire + myear)
            var layer_vect = ee.Image().byte().paint(feat_fire, 1, 1.5);
            Map.addLayer(layer_vect, {palette: 'AF0000'}, 'fire_' + myear);
        })

    },
    // Register a function to draw a chart when a user clicks on the map.
    Normalized_Burn_Ratio: function(img){
        var nbrImg = img.divide(10000).expression(
            "float((b('nir') - b('swir2')) / (b('nir') + b('swir2')))").rename(['nbr']);     
        
        return img.addBands(nbrImg);
    },
    Normalized_Burn_Ratio_2: function(img){
        var nbrImg = img.divide(10000).expression(
            "float((b('swir1') - b('swir2')) / (b('swir1') + b('swir2')))").rename(['nbr2']);     
        
        return img.addBands(nbrImg);
    },
    Burned_Area_Index: function(img){
        var baiImg = img.divide(10000).expression(
            "float(1/ ((0.06 - b('nir'))**2 + (0.1 - b('red'))**2))").rename(['bai']);     
        
        return img.addBands(baiImg);
    },
    indice_verde: function(img){
        var verde_Img = img.divide(10000).expression(
            "float(0.0 / b('nir'))").rename(['zero']);     
        
        return img.addBands(verde_Img);
    },
    Burned_Area_Index_Mod_SWIR1: function(img){
        var baimsImg = img.divide(10000).expression(
            "float(1/ ((0.06 - b('nir'))**2 + (0.1 - b('swir1'))**2))").rename(['baims']);     
        
        return img.addBands(baimsImg);
    },
    Burned_Area_Index_Mod_SWIR2: function(img){
        var baimlImg = img.divide(10000).expression(
            "float(1/ ((0.005 - b('nir'))**2 + (0.2 - b('swir2'))**2))").rename(['baiml']);     
        
        return img.addBands(baimlImg);
    },
    Mid_Infrared_Burn_Index: function(img){
        var mirBIImg = img.divide(10000).expression(
            "float((0.06 * b('swir1')) - (9.8 * b('swir2')) + 2)").rename(['mirbi']);     
        
        return img.addBands(mirBIImg);
    },
    Normalized_Difference_Moisture_Index: function(img){
        var ndmiImg = img.divide(10000).expression(
            "float((b('nir') - b('swir1')) / (b('nir') + b('swir1')))").rename(['ndmi']);     
        
        return img.addBands(ndmiImg);
    },
    Normalized_Difference_Vegetation_Index: function(img){
        var ndviImg = img.divide(10000).expression(
            "float((b('nir') - b('red')) / (b('nir') + b('red')))").rename(['ndvi']);     
        
        return img.addBands(ndviImg);
    },
    Soil_Adjusted_Vegetation_Index: function(img){
        var saviImg = img.divide(10000).expression(
            "float(1.5 * (b('nir') - b('red')) / (b('nir') + b('red') + 0.5))").rename(['savi']);     
        
        return img.addBands(saviImg);
    },
    Enhanced_Vegetation_Index: function(img){
        var eviImg = img.divide(10000).expression(
            "float(2.5 * (b('nir') - b('swir2')) / (b('nir') + 6 * b('red') + 7.5 * b('blue') + 1))").rename(['evi']);     
        
        return img.addBands(eviImg);
    },

}

application.vis = {

    agricola: {
        min: 0, 
        max: 8, 
        palette: 'DCE0D6,E974ED,D5A6BD,C27BA0,F3B4F1,C59FF4,E787F8,FFD966,FFF3BF'
    },
    vis_l8: { 
        min: 40, 
        max: 3500, 
        bands: ['swir1','nir', 'red'] 
    },
   
};
application.styles = {
    mapas: {
        height: '800px',
        border: '2px solid black'
    },
    label_tensor: {
        'width': '5%',
        'backgroundColor': '#F5F4F9'
    },
    panel_main: {
        'width': '200px',
        'height': '150px',
        'position': 'bottom-left',
        'backgroundColor': '#cccccc',
        'margin': '0px 0px 0px 1px',
    },
    panel_selected: {
        'height': '650px',
        'stretch': 'vertical',
        'position': 'bottom-right'
    },
    panel_ploting: {
        width: '600px',
        height: "260px",
        position: 'bottom-right'
    }

};


application.UI = {

    building_ui : function(){     
        application.UI.pPrincipal.add(application.UI.label_header);
        application.UI.pPrincipal.add(application.UI.panel_selector);

        Map.add(application.UI.pPrincipal);
        Map.add(application.UI.panel_plot)
        
        Map.onClick(function(coords) {
            application.UI.panel_plot.clear();
            var point = ee.Geometry.Point(coords.lon, coords.lat);
            // var list_of_value = application.dataset.serie_landsat.reduce()
            var serie_Chart = ui.Chart.image.series({
                              imageCollection: application.dataset.serie_landsat.select(['zero',"nbr", 'nbr2','ndvi']), //,'bai'
                              region: point,
                              reducer: ee.Reducer.first(),
                              scale: 30,
                              xProperty: 'system:time_start'
                            })
                            .setSeriesNames(['zero',"nbr", 'nbr2','ndvi']) // ,'bai'
                            .setOptions({
                              title: 'Series valores de indices de queimadas',
                              hAxis: {title: 'Date', titleTextStyle: {italic: false, bold: true}},
                              vAxis: {
                                title: 'nbr (x1e4)',
                                titleTextStyle: {italic: false, bold: true}
                              },
                              lineWidth: 1,
                              pointSize: 2,
                              colors: ['ffffff','f0af07', '0f8755', '76b349'],
                              curveType: 'function'
                      });
            serie_Chart.setOptions({title: 'Series de indices de queimada'});
            application.UI.panel_plot.add(serie_Chart);
          });
          Map.style().set('cursor', 'crosshair');        
        
        // ui.root.add(application.UI.pPrincipal);
        // ui.root.widgets().reset([application.UI.pPrincipal]);
        ui.root.setLayout(ui.Panel.Layout.Flow('vertical'));

    },

    pPrincipal: ui.Panel({
        'layout': ui.Panel.Layout.flow('vertical'),
        'style': application.styles.panel_main,
    }),
    panel_plot: ui.Panel({        
        'style': application.styles.panel_ploting,
    }),
    label_header: ui.Label('Select year', {  
        'fontSize': '16px',
        'padding': '2px',      
        'stretch': 'horizontal',        
        'backgroundColor': '#F5F4F9',        
    }),
    
    panel_selector: ui.Select({
        placeholder: 'Select a year',
        items: application.dataset.lst_year,
        onChange: function(year){
            // bacia_focused = mcpio;
            print("selected year ===> " + year);
            application.dataset.year_selected = year;
            
           var end_date = application.dataset.year_selected + '-12-31';
           var start_date = application.dataset.year_selected + '-01-01';
           //var start_date = application.dataset.year_selected + '-08-01';
           //var end_date = application.dataset.year_selected + '-07-01';

            application.dataset.serie_landsat_year = application.dataset.serie_landsat.filterDate(start_date, end_date);           
            application.functions.show_imgs_serie_year();
        },
        style: application.styles.select_mps
    }),
    



};

application.initUi();