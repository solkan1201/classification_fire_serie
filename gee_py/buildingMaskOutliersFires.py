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
import arqNewparametros as aparam
# import arqNewparamcopy as aparam
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
    'asset_output': 'users/SarahMoura/Doutorado/Dados/Serie_indices_Landsat/',
    'asset_input': 'users/SarahMoura/Doutorado/Dados/SerieLandsat',
    'asset_meanNBR': 'users/SarahMoura/Doutorado/Dados/ImgBase/images_real_medianNBR_portugal_fire',
    'asset_intervNBR': 'users/SarahMoura/Doutorado/Dados/ImgBase/images_real_intervaloNBR_portugal_fire',
    'asset_meanBAIML': 'users/SarahMoura/Doutorado/Dados/ImgBase/images_real_medianBAIML_portugal_fire',
    'asset_intervBAIML': 'users/SarahMoura/Doutorado/Dados/ImgBase/images_real_intervaloBAIML_portugal_fire',
    'asset_Coef': 'users/SarahMoura/Doutorado/Dados/ImgBase/image_coeficientes_portugal_fire',
    'bnd_int': ['red', 'nir', 'swir1', 'swir2']    
}

export_original = true

def borderRemove (image):
    
    polygon = image.geometry()
    return image.clip(polygon.buffer(-500.0))

def Normalized_Burn_Ratio_BAI (img):
    nbrImg = img.expression(
        "float((b('nir') - b('swir2')) / (b('nir') + b('swir2')))").rename(['nbr'])
    
    baiImg = img.expression(
        "float(1/ ((0.05 - b('nir'))**2 + (0.2 - b('swir2'))**2))").rename(['baiml'])
    
    return img.addBands(nbrImg).addBands(baiImg)

def cloudMaskL457 (image):
    
    qa = ee.Image(image.select('pixel_qa'));
    # If the cloud bit (5) is set and the cloud confidence (7) is high
    # or the cloud shadow bit is set (3), then it's a bad pixel.
    cloud = qa.bitwiseAnd(1 << 5).And(
                    qa.bitwiseAnd(1 << 7)).Or(
                    qa.bitwiseAnd(1 << 3))
    
    # Remove edge pixels that don't occur in all bands
    mask2 = ee.Image(image).mask().reduce(ee.Reducer.min())
    
    return borderRemove(ee.Image(image).updateMask(
                cloud.Not()).updateMask(mask2))

def maskL8sr(image):
    # Bits 3 and 5 are cloud shadow and cloud, respectively.
    cloudShadowBitMask = (1 << 3)
    cloudsBitMask = (1 << 5)

    # Get the pixel QA band.
    qa = image.select('pixel_qa');
    # Both flags should be set to zero, indicating clear conditions.
    mask = qa.bitwiseAnd(1 << 3).eq(0).And(
                qa.bitwiseAnd(1 << 5).eq(0))
    
    return borderRemove(image.updateMask(mask))


def get_landsatCollection (img):
  
    id_l = img.id()
    # print("id da image ", id_l)
    strId = ee.String(id_l).slice(0, -7)

    patronl8 = strId.index('LC08')
    patronl7 = strId.index('LE07')
    
    bands_L57 = ["B1","B3","B4","B5","B7",'pixel_qa']
    bands_L8 = ["B2","B4","B5","B6","B7",'pixel_qa']
    bnds_name = ["blue","red","nir","swir1","swir2",'pixel_qa']
    img_new =  ee.Algorithms.If(
                          ee.Algorithms.IsEqual(patronl8, -1),
                          ee.Algorithms.If(
                                ee.Algorithms.IsEqual(patronl7, -1),
                                cloudMaskL457(ee.ImageCollection('LANDSAT/LT05/C01/T1_SR').filter(
                                                  ee.Filter.eq('system:index', strId)
                                                  ).first().select(bands_L57, bnds_name)),
                                cloudMaskL457(ee.ImageCollection('LANDSAT/LE07/C01/T1_SR').filter(
                                                  ee.Filter.eq('system:index', strId)
                                                  ).first().select(bands_L57, bnds_name))
                            ),
                            maskL8sr(ee.ImageCollection('LANDSAT/LC08/C01/T1_SR').filter(
                                        ee.Filter.eq('system:index', strId)
                                        ).first().select(bands_L8, bnds_name))
                    )
    
    return img_new

def funct_export_Img(imagem, name_im, geom):    
      
    asset_path = params.asset_output + name_im
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



imgCol = ee.ImageCollection(params.asset_input).sort('system:time_start')
geome = imgCol.geometry()
size_imgC = ee.Number(imgCol.size())

if (export_original == true):
    print("mudou ")
    serie_landsat = imgCol.map(get_landsatCollection);
    #// var teste = get_landsatCollection(serie_landsat_Col.first())
    
else:
    serie_landsat = imgCol


serie_landsat_ind = serie_landsat.map(lambda img : Normalized_Burn_Ratio_BAI(img))

ls_index = serie_landsat_ind.reduceColumns(ee.Reducer.toList(), ['system:index']).get('list').getInfo()



ampliInterv = 3
img_mediaNBR = ee.Image(params['asset_meanNBR'])
img_mediaBAI = ee.Image(params['asset_meanBAIML'])
img_intervalNBR = ee.Image(params['asset_intervNBR'])
img_intervalBAI = ee.Image(params['asset_intervBAIML'])

img_coeficients = ee.Image(params['asset_Coef'])

serie_landsat = serie_landsat.toList(size_imgC)
serie_landsat = ee.List(serie_landsat)

# seqTempo = ee.List.sequence(1, ee.Number(size_imgC).add(1))

for cc, indexx in enumerate(ls_index):

    val = cc + 1
    indEst_NBR = ee.Image.constant(val).multiply(
                                    img_coeficients.select('coef_nbr_b1')).add(
                                        img_coeficients.select('coef_nbr_b0')).rename('nbr_est')

    indEst_NBR = indEst_NBR.clip(geome)
    indEst_BAI = ee.Image.constant(val).multiply(
                                img_coeficients.select('coef_baiml_b1')).add(
                                    img_coeficients.select('coef_baiml_b0')).rename('baiml_est')
    indEst_BAI = indEst_BAI.clip(geome)
    
    indEst_NBRSup = indEst_NBR.add(img_intervalNBR.multiply(ee.Image.constant(ampliInterv)))
    indEst_NBRSInf = indEst_NBR.subtract(img_intervalNBR.multiply(ee.Image.constant(ampliInterv)))
    indEst_BAISup = indEst_BAI.add(img_intervalBAI.multiply(ee.Image.constant(ampliInterv)))
    indEst_BAIInf = indEst_BAI.subtract(img_intervalBAI.multiply(ee.Image.constant(ampliInterv)))
    
    imgNBR = ee.Image(serie_landsat_ind.filter(
                    ee.Filter.eq('system:index', indexx)).first()).select('nbr')
    imgBAI = ee.Image(serie_landsat_ind.filter(
                    ee.Filter.eq('system:index', indexx)).first()).select('baiml')

    imgMaskOutlierNBR = imgNBR.gt(indEst_NBRSup).add(imgNBR.lt(indEst_NBRSInf))
    imgMaskOutlierNBR = imgMaskOutlierNBR.lte(1).rename('mask_nbr');

    imgMaskOutlierBAI = imgBAI.gt(indEst_BAISup).add(imgBAI.gt(indEst_BAIInf))
    imgMaskOutlierBAI = imgMaskOutlierBAI.gte(1).rename('mask_bai');
    bandInt = ["red","nir","swir1","nbr","bai"]
    imgExp = ee.Image(serie_landsat.get(val)).select(bandInt).addBands(
                        imgMaskOutlierNBR).addBands(imgMaskOutlierBAI)
    
    # var name_im = imgExp.get('system:index').getInfo();
    name_im = imgExp.id().getInfo();

    funct_export_Img(imgExp, name_im, geome)