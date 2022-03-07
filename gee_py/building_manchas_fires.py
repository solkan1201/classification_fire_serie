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



params = {
    # asset_output: 'users/CartasSol/temporal/',
    'asset_output': 'users/sdoutorado/serieManchasFire/',
    'asset_inputInd': 'users/sdoutorado/serie_indexs_withDif_inLandsat',
    'asset_inputHar': 'users/shdoutorado/serieHarmonica'       
}

def funct_export_Img(imagem, name_im, geom):    
      
    asset_path = params['asset_output'] + name_im
    print(" en id Asset:")
    print("   <> {}".format(asset_path))
    
    optExp = {
        'image': imagem, #.toInt16()
        'description': name_im, 
        'assetId':asset_path, 
        'pyramidingPolicy': {".default": "mode"},  
        'region': geom.getInfo()['coordinates'],
        'scale': 30,
        'maxPixels': 1e13 
    }

    task = ee.batch.Export.image.toAsset(**optExp)    
    task.start()
    print ("salvando ... !")


# export_original = true
indexAnalise = 'nbr'
index_a_harm = 'nbr_fitted'
imgCIndexs = ee.ImageCollection(params['asset_inputInd'])
imgColHarmo = ee.ImageCollection(params['asset_inputHar'])

def building_img_ruido(img):
    ids = img.id()
    imgH = imgColHarmo.filter(ee.Filter.eq('system:index', ids)).first()
    ruido  = img.select(indexAnalise).subtract(imgH.select(index_a_harm))
    img = img.addBands(ruido.lt(-0.2).rename('ruido'))
    return img.select('ruido')#

imgC_ruido = imgCIndexs.map(lambda img: building_img_ruido(img))

ls_index = imgCIndexs.reduceColumns(ee.Reducer.toList(), ['system:index']).get('list').getInfo()

for indx in ls_index:
    imgR = ee.Image(imgC_ruido.filter(
                    ee.Filter.eq('system:index', indx)).first())
    
    geom = imgR.geometry()

    funct_export_Img(imgR, indx, geom)