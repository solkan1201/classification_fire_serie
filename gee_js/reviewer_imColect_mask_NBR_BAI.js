 

var application = {}; // object principal
application.dataset = {
    asset_serie: 'users/SarahMoura/Doutorado/Dados/Serie_indices_Landsat',
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
                Map.addLayer(img_temp.select('nbr'), application.vis.visNBR, "NBR", visualizar);
                Map.addLayer(img_temp.select('bai'), application.vis.visBAI, 'BAI', visualizar);
                var maskNBR = img_temp.select('mask_nbr')
                Map.addLayer(maskNBR.updateMask(maskNBR), application.vis.visMaskNBR, 'MaskNBR', visualizar);
                var maskBAI = img_temp.select('mask_bai')
                Map.addLayer(maskBAI.updateMask(maskBAI), application.vis.visMaskBAI, 'MaskBAI', visualizar);
                cc = cc + 1;                
            })

            var feat_fire  = ee.FeatureCollection(application.dataset.asset_polg_fire + myear)
            var layer_vect = ee.Image().byte().paint(feat_fire, 1, 1.5);
            Map.addLayer(layer_vect, {palette: 'AF0000'}, 'fire_' + myear);
        })

    }    

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
    visNBR: { 
        min: -0.8,
        max: 1.0,
        palette : 'C0FF33,E0FF33,FFEB33,E8AD1C,E8A01C,E8831C,E8631C,E8531C,E8361C,E81C1C,B8290B'
    },
    visBAI: {
        min: -0.0000000253855532151,
        max: 0.00003611827560234815,
        palette : '3E9204,39B80B,51B80B,93D108,DAF322,E7F322,EAF419,F0FC06'
    },
    visMaskNBR: { 
        min: 0, 
        max: 1, 
        palette: 'FF0000'
    },
    visMaskBAI: { 
        min: 0, 
        max: 1, 
        palette: 'FFF633'
    }
   
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
            var serie_Chart = ui.Chart.image.series(
                    application.dataset.serie_landsat.select(["nbr2",'bai']), point, ee.Reducer.mean(), 30)
                    .setSeriesNames(["nbr",'bai'])
                    .setOptions({
                      trendlines: {
                          0: { color: 'CC0000' }
                      },
                      title: 'Series valores de indices de queimadas',
                      lineWidth: 1,
                      pointSize: 2,
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
            
            var start_date = application.dataset.year_selected + '-01-01';
            var end_date = application.dataset.year_selected + '-12-31';

            application.dataset.serie_landsat_year = application.dataset.serie_landsat.filterDate(start_date, end_date);           
            application.functions.show_imgs_serie_year();
        },
        style: application.styles.select_mps
    }),
    



};

application.initUi();

