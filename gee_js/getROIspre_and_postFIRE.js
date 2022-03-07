

var functionExportROIs = function(rois, name_ROIs){
    var asset_output = 'users/sdoutorado/ROIs' + name_ROIs 
    var optExp = {
        'collection': rois, 
        'description': name_ROIs, 
        'assetId':  asset_output        
    }
    Export.table.toAsset(optExp)
    optExp = {
        'collection': rois, 
        'description': name_ROIs, 
        'folder':  'CSV_ROIs'        
    }
    Export.table.toDrive(optExp)
                        
            
}
var asset = 'users/sdoutorado/serie_indexs_withDif_inLandsat/'
// var imColIndex =  ee.ImageCollection(asset)

// print(imColIndex.first())
// print(Fire_2005)
// 2005 27 pontos
// pre fire- LT05_204031_20050121_normal
// post fire- LT05_204031_20050918_normal
var im_pre2005_fire = ee.Image(asset + 'LT05_204031_20050121_normal')
print("image pre fire do 2005 ", im_pre2005_fire)
var pmtroSample = {
  region: Fire_2005.geometry(), 
  scale: 30, 
  numPixels: Fire_2005.size(),
  tileScale: 2,
  geometries: true
}
var ptosPre2005Fire = im_pre2005_fire.sample(pmtroSample)
ptosPre2005Fire = ptosPre2005Fire.map(function(feat){
                                  return feat.set('class', 0)
                              })
var name_ROIs_exp = 'ptos_Pre_2005_Fire'
functionExportROIs(ptosPre2005Fire, name_ROIs_exp)

var im_post2005_fire = ee.Image(asset + 'LT05_204031_20050918_normal')
print("image post fire do 2005 ", im_post2005_fire)

var ptosPost2005Fire = im_post2005_fire.sample(pmtroSample)
ptosPost2005Fire = ptosPost2005Fire.map(function(feat){
                                  return feat.set('class', 1)
                              })
name_ROIs_exp = 'ptos_Post_2005_Fire'
functionExportROIs(ptosPost2005Fire, name_ROIs_exp)

// 2013 37 pontos
// pre fire- LC08_204031_20130417_normal
// post fire- LC08_204031_20131010_normal
var im_pre2013_fire = ee.Image(asset + 'LC08_204031_20130417_normal')
print("image pre fire do 2013 ", im_pre2013_fire)
var pmtroSample = {
  region: fire_2013.geometry(), 
  scale: 30, 
  numPixels: fire_2013.size(),
  tileScale: 2,
  geometries: true
}
var ptosPre2013Fire = im_pre2013_fire.sample(pmtroSample)
ptosPre2013Fire = ptosPre2013Fire.map(function(feat){
                                  return feat.set('class', 0)
                              })
var name_ROIs_exp = 'ptos_Pre_2013_Fire'
functionExportROIs(ptosPre2013Fire, name_ROIs_exp)

var im_post2013_fire = ee.Image(asset + 'LC08_204031_20131010_normal')
print("image post fire do 2013 ", im_post2013_fire)

var ptosPost2013Fire = im_post2013_fire.sample(pmtroSample)
ptosPost2013Fire = ptosPost2013Fire.map(function(feat){
                                  return feat.set('class', 1)
                              })
name_ROIs_exp = 'ptos_Post_2013_Fire'
functionExportROIs(ptosPost2013Fire, name_ROIs_exp)

// 2002 16 pontos
// pre fire- LE07_204031_20020326_normal (vegetação seca)
//           LE07_204031_20020427_normal (vegetação verde)
//           LE07_204031_20020630_normal (vegetação verde)
// post fire- LE07_204031_20021004_normal

var im_pre2002_fire_vegSeca = ee.Image(asset + 'LE07_204031_20020326_normal')
print("image pre fire do 2002 ", im_pre2002_fire_vegSeca)
var pmtroSample = {
  region: fire_2002.geometry(), 
  scale: 30, 
  numPixels: fire_2002.size(),
  tileScale: 2,
  geometries: true
}
var ptosPre2002Fire_vegSeca = im_pre2002_fire_vegSeca.sample(pmtroSample)
ptosPre2002Fire_vegSeca = ptosPre2002Fire_vegSeca.map(function(feat){
                                  return feat.set('class', 0)
                              })
var name_ROIs_exp = 'ptos_Pre_2002_Fire_vegSeca'
functionExportROIs(ptosPre2002Fire_vegSeca, name_ROIs_exp)

var im_pre2002_fire_vegVerde = ee.Image(asset + 'LE07_204031_20020427_normal')
print("image pre fire do 2002 veg verde  ", im_pre2002_fire_vegVerde)
var pmtroSample = {
  region: fire_2002.geometry(), 
  scale: 30, 
  numPixels: fire_2002.size(),
  tileScale: 2,
  geometries: true
}
var ptosPre2002Fire_vegVerde = im_pre2002_fire_vegVerde.sample(pmtroSample)
ptosPre2002Fire_vegVerde = ptosPre2002Fire_vegVerde.map(function(feat){
                                  return feat.set('class', 0)
                              })
var name_ROIs_exp = 'ptos_Pre_2002_Fire_vegVed'
functionExportROIs(ptosPre2002Fire_vegVerde, name_ROIs_exp)

var im_post2002_fire = ee.Image(asset + 'LE07_204031_20021004_normal')
print("image post fire do 2002 ", im_post2002_fire)

var ptosPost2002Fire = im_post2002_fire.sample(pmtroSample)
ptosPost2002Fire = ptosPost2002Fire.map(function(feat){
                                  return feat.set('class', 1)
                              })
name_ROIs_exp = 'ptos_Post_2002_Fire'
functionExportROIs(ptosPost2002Fire, name_ROIs_exp)



// Solo exposto (open_soil) 30 pontos- LE07_204031_20020326_normal 
// Area urbana (urban) 20 pontos- LC08_204031_20191011_normal

var im_2002_opensoil = ee.Image(asset + 'LE07_204031_20020326_normal')
print("image by rois open soil do 2002 ", im_2002_opensoil)
pmtroSample = {
  region: open_soil.geometry(), 
  scale: 30, 
  numPixels: open_soil.size(),
  tileScale: 2,
  geometries: true
}
var ptos2002opensoil = im_2002_opensoil.sample(pmtroSample)
ptos2002opensoil = ptos2002opensoil.map(function(feat){
                                  return feat.set('class', 0)
                              })
var name_ROIs_exp = 'ptos_2002_open_soil'
functionExportROIs(ptos2002opensoil, name_ROIs_exp)

var im_post2019_urban = ee.Image(asset + 'LC08_204031_20191011_normal')
print("image by rois urban do 2019 ", im_post2019_urban)
pmtroSample = {
  region: urban.geometry(), 
  scale: 30, 
  numPixels: urban.size(),
  tileScale: 2,
  geometries: true
}
var ptos2019Urban = im_post2019_urban.sample(pmtroSample)
ptos2019Urban = ptos2019Urban.map(function(feat){
                                  return feat.set('class', 0)
                              })
name_ROIs_exp = 'ptos_2019_urban'
functionExportROIs(ptos2019Urban, name_ROIs_exp)