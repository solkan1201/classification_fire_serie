#-*- coding utf-8 -*-
import ee
import gee 
import os
import sys
import random
from datetime import date
import copy
import math
import json
import collections
collections.Callable = collections.abc.Callable

try:
  ee.Initialize()
  print('The Earth Engine package initialized successfully!')
except ee.EEException as e:
  print('The Earth Engine package failed to initialize!')
except:
    print("Unexpected error:", sys.exc_info()[0])
    raise

def Normalized_Burn_Ratio (img):
    nbrImg = img.expression(
        "float((b('nir') - b('swir2')) / (b('nir') + b('swir2')))").rename(['nbr'])     
    return img.addBands(nbrImg)

def Normalized_Burn_Ratio_2 (img):
    nbrImg = img.expression(
        "float((b('swir1') - b('swir2')) / (b('swir1') + b('swir2')))").rename(['nbr2'])      
    return img.addBands(nbrImg)

def Burned_Area_Index (img):
    baiImg = img.expression(
        "float(1/ ((0.06 - b('nir'))**2 + (0.1 - b('red'))**2))").rename(['bai'])     
    return img.addBands(baiImg)

def indice_verde (img):
    verde_Img = img.expression(
        "float(0.0 / b('nir'))").rename(['zero'])     
    return img.addBands(verde_Img)

def Burned_Area_Index_Mod_SWIR1 (img):
    baimsImg = img.expression(
        "float(1/ ((0.05 - b('nir'))**2 + (0.2 - b('swir1'))**2))").rename(['baims'])      
    return img.addBands(baimsImg)

def Burned_Area_Index_Mod_SWIR2 (img):
    baimlImg = img.expression(
        "float(1/ ((0.05 - b('nir'))**2 + (0.2 - b('swir2'))**2))").rename(['baiml'])   
    return img.addBands(baimlImg)

def Mid_Infrared_Burn_Index (img):
    mirBIImg = img.expression(
        "float((10 * b('swir1')) - (9.8 * b('swir2')) + 2)").rename(['mirbi'])      
    return img.addBands(mirBIImg)

def Normalized_Difference_Moisture_Index (img):
    ndmiImg = img.expression(
        "float((b('nir') - b('swir1')) / (b('nir') + b('swir1')))").rename(['ndmi'])    
    return img.addBands(ndmiImg)

def Normalized_Difference_Vegetation_Index (img):
    ndviImg = img.expression(
        "float((b('nir') - b('red')) / (b('nir') + b('red')))").rename(['ndvi'])     
    return img.addBands(ndviImg)

def Soil_Adjusted_Vegetation_Index (img):
    saviImg = img.expression(
        "float(1.5 * (b('nir') - b('red')) / (b('nir') + b('red') + 0.5))").rename(['savi'])    
    return img.addBands(saviImg)

def Enhanced_Vegetation_Index (img):
    eviImg = img.expression(
        "float(2.5 * (b('nir') - b('swir2')) / (b('nir') + 6 * b('red') + 7.5 * b('blue') + 1))").rename(['evi'])    
    
    return img.addBands(eviImg)

def IndiceIndicadorAgua(img):
    iiaImg = img.expression(
                    "float((b('green') - 4 *  b('nir')) / (b('green') + 4 *  b('nir')))").rename("iia")            
    return img.addBands(iiaImg)

def agregateBandsIndexSoil (img):
    soilImg = img.expression(
        "float(b('nir') - b('green')) / (b('green') + b('nir'))").rename(['isoil'])
    return img.addBands(soilImg)





def exportarClassification(ClassAl, nameAl, geomet):    
     
    IdAsset = 'users/sdoutorado/fireClass/' + nameAl
    print(" en id Asset:")
    print("   <> {}".format(IdAsset))
    
    optExp = {
        'image': ClassAl, 
        'description': nameAl, 
        'assetId': IdAsset, 
        'pyramidingPolicy': {".default": "mode"},  
        'region': geomet.getInfo()['coordinates'],
        'scale': 10,
        'maxPixels': 1e13 
    }

    task = ee.batch.Export.image.toAsset(**optExp)                         
    task.start()  

    print ("exportantando ... {} image class ... !".format(nameAl))


params = {    
    'asset_inputS': 'users/sdoutorado/serieManchasFire', 
    'asset_polg_fire': 'users/SarahMoura/Doutorado/areaArdida/AA_nut3_',
    'limitPort': 'users/SarahMoura/Doutorado/limitePT',
    'asset_rois': 'users/sdoutorado/ROIsClass2/',
    'bnd_int': ['nir', 'nbr', 'mirbi','dNBR'],
    'lst_year': ['2001','2002','2003','2012','2004','2005','2006','2007','2008','2009',
                '2010','2011','2013','2014','2015','2016','2017','2018','2019','2020']     
}

dict_year_rois = {
    '2001': ['LE07_204031_20010915_normal_rois', 'LE07_204031_20021004_normal_rois'], 
    '2002': ['LE07_204031_20010915_normal_rois', 'LE07_204031_20021004_normal_rois'],
    '2003': ['LE07_204031_20010915_normal_rois', 'LE07_204031_20021004_normal_rois'],
    '2012': ['LE07_204031_20010915_normal_rois', 'LE07_204031_20021004_normal_rois'],
    '2004': ['LT05_204031_20051004_normal_rois', 'LT05_204031_20101018_normal_rois'],
    '2005': ['LT05_204031_20051004_normal_rois', 'LT05_204031_20101018_normal_rois'],
    '2006': ['LT05_204031_20051004_normal_rois', 'LT05_204031_20101018_normal_rois'],
    '2007': ['LT05_204031_20051004_normal_rois', 'LT05_204031_20101018_normal_rois'],
    '2008': ['LT05_204031_20051004_normal_rois', 'LT05_204031_20101018_normal_rois'], 
    '2009': ['LT05_204031_20051004_normal_rois', 'LT05_204031_20101018_normal_rois'], 
    '2010': ['LT05_204031_20051004_normal_rois', 'LT05_204031_20101018_normal_rois'],
    '2011': ['LT05_204031_20051004_normal_rois', 'LT05_204031_20101018_normal_rois'],      
    '2013': ['LC08_204031_20131010_normal_rois', 'LC08_204031_20160916_normal_rois'],
    '2014': ['LC08_204031_20131010_normal_rois', 'LC08_204031_20160916_normal_rois'],
    '2015': ['LC08_204031_20131010_normal_rois', 'LC08_204031_20160916_normal_rois'],
    '2016': ['LC08_204031_20131010_normal_rois', 'LC08_204031_20160916_normal_rois'], 
    '2017': ['LC08_204031_20131010_normal_rois', 'LC08_204031_20160916_normal_rois'], 
    '2018': ['LC08_204031_20131010_normal_rois', 'LC08_204031_20160916_normal_rois'], 
    '2019': ['LC08_204031_20131010_normal_rois', 'LC08_204031_20160916_normal_rois'], 
    '2020': ['LC08_204031_20131010_normal_rois', 'LC08_204031_20160916_normal_rois']
}

imgColSerie = ee.ImageCollection(params['asset_inputS']).sort('system:time_start')
limitPT = ee.FeatureCollection(params['limitPort']).geometry()

bands_L57 = ["B1","B2","B3","B4","B5","B7"]
bands_L8 = ["B2","B3","B4","B5","B6","B7"]
bnds_name = ["blue","green","red","nir","swir1","swir2"]
primer = True
lst_mais_tres = []
treinado = False
sensorROI = ''

for year_current in params['lst_year']:
    date_start = year_current + '-01-01'
    date_end = year_current + '-12-31'

    listCol = imgColSerie.filterDate(date_start, date_end)
    lst_indexImage = listCol.reduceColumns(ee.Reducer.toList(), ['system:index']).get('list').getInfo()
    print("length of list images ", len(lst_indexImage))
    print("list ", lst_indexImage)

    if primer == False:
        lst_indexImage = lst_mais_tres + lst_indexImage

    roi_year = ee.FeatureCollection(params['asset_rois'] + dict_year_rois[year_current][0]).merge(
                    ee.FeatureCollection(params['asset_rois'] + dict_year_rois[year_current][1]))

    
    pmtRF = {     
            'numberOfTrees': 160, 
            'variablesPerSplit': 6,
            'minLeafPopulation': 10,
            # 'bagFraction': 0.8
        }
    #     clf = RandomForestClassifier(
    #                   n_estimators=160, 
    #                   max_features=6, 
    #                   min_samples_split=10, 
    #                   oob_score = True, 
    #                   bootstrap = True)
    if 'LC08' == dict_year_rois[year_current][0][:4]:
        columnaTraining = [  'nir','mirbi','dmirbi','evi','nbr','dnbr','green','dnirr','red',
                                            'swir1','ndmi','isoil','blue','iia','savi']
    
    elif 'LE07' == dict_year_rois[year_current][0][:4]:
        columnaTraining = [  'nir','mirbi','red','evi','green','nbr','swir1','dnirr','dndvi','dnbr',
                                    'ndmi','dmirbi','isoil','iia','blue','savi']
    
    else:
        columnaTraining = [  'nir','green','mirbi','swir1','blue','dnirr','nbr','dndvi','dmirbi','evi',
                                    'iia','dnbr','isoil','ndmi','savi'  ]
    
    if sensorROI != dict_year_rois[year_current][0][:4]:
        sensor = dict_year_rois[year_current][0][:4]
        print("treinando classificador com sensor == ", sensor)
        serializeClassificador = ee.Classifier.smileRandomForest(**pmtRF).train(roi_year , 'class', columnaTraining)
        

    lst_mais_tres = lst_indexImage[:-3]
    delta  = 3

    for cc, index_img in enumerate(lst_indexImage):

        if year_current != '2001':
            delta = 2

        if cc >= 3:

            imgMask = imgColSerie.filter(ee.Filter.eq('system:index', index_img)).first()

            strId = index_img[: -7]
            strId_pre = lst_indexImage[cc - delta][: -7]
        
            if 'LC08' in index_img:
                imgLandsat = ee.Image('LANDSAT/LC08/C01/T1_SR/'  + strId).select(bands_L8, bnds_name)                              
                        
            elif 'LE07' in index_img:
                imgLandsat = ee.Image('LANDSAT/LE07/C01/T1_SR/' + strId).select(bands_L57, bnds_name)                               
                
            else:
                imgLandsat = ee.Image('LANDSAT/LT05/C01/T1_SR/' + strId).select(bands_L57, bnds_name)
                
            

            # -----*******------------------************---------------------*************---------------
            
            if 'LC08' in strId_pre:
                imgLandsat_pre = ee.Image('LANDSAT/LC08/C01/T1_SR/'  + strId).select(bands_L8, bnds_name)
                        
            elif 'LE07' in strId_pre:
                imgLandsat_pre = ee.Image('LANDSAT/LE07/C01/T1_SR/' + strId).select(bands_L57, bnds_name)
                
            else:
                imgLandsat_pre = ee.Image('LANDSAT/LT05/C01/T1_SR/' + strId).select(bands_L57, bnds_name)
            
            geom = imgLandsat.geometry()

            imgLandsat = imgLandsat.updateMask(imgMask)
            imgLandsat = imgLandsat.clip(limitPT);
            imgLandsat_pre  =imgLandsat_pre.updateMask(imgMask)
            imgLandsat_pre = imgLandsat_pre.clip(limitPT);
            
            imgLandsat = Normalized_Burn_Ratio(imgLandsat)
            imgLandsat_pre = Normalized_Burn_Ratio(imgLandsat_pre)

            difNBR = imgLandsat_pre.select('nbr').subtract(imgLandsat.select('nbr')).rename('dnbr')
            difNIR = imgLandsat_pre.select('nir').subtract(imgLandsat.select('nir')).rename('dnirr')

            imgLandsat = Burned_Area_Index(ee.Image(imgLandsat))
            imgLandsat = agregateBandsIndexSoil(ee.Image(imgLandsat))
            imgLandsat = IndiceIndicadorAgua(ee.Image(imgLandsat))
            imgLandsat = Burned_Area_Index_Mod_SWIR1(ee.Image(imgLandsat))
            imgLandsat = Burned_Area_Index_Mod_SWIR2(ee.Image(imgLandsat))
            imgLandsat = Mid_Infrared_Burn_Index(ee.Image(imgLandsat))
            imgLandsat_pre = Mid_Infrared_Burn_Index(ee.Image(imgLandsat_pre))
            difMIRBI = imgLandsat_pre.select('mirbi').subtract(imgLandsat.select('mirbi')).rename('dmirbi')
            
            imgLandsat = Normalized_Difference_Moisture_Index(ee.Image(imgLandsat))
            imgLandsat = Normalized_Difference_Vegetation_Index(ee.Image(imgLandsat))
            imgLandsat_pre = Normalized_Difference_Vegetation_Index(ee.Image(imgLandsat_pre))
            difNDVI = imgLandsat_pre.select('ndvi').subtract(imgLandsat.select('ndvi')).rename('dndvi')

            imgLandsat = Soil_Adjusted_Vegetation_Index(ee.Image(imgLandsat))
            imgLandsat = Enhanced_Vegetation_Index(ee.Image(imgLandsat))
            imgLandsat = imgLandsat.addBands(difNBR).addBands(difNIR).addBands(difMIRBI).addBands(difNDVI) 

            print("a classificar ", imgLandsat.bandNames().getInfo())
            
            classFire = imgLandsat.classify(serializeClassificador, 'fire')
            exportarClassification(classFire, strId + "_fire", geom)

    primer = True