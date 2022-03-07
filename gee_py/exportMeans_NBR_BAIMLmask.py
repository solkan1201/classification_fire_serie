
#-*- coding utf-8 -*-
import ee
import os
import sys
import copy
import math
import numpy as np
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
    'asset_output': {
        '0':'users/sdoutorado/serie_indexs_withDif_inLandsat/',
        # '0': 'users/sdoutorado/serie_indices_inLansat/',
        '1': 'users/sdoutorado/indices/'
    },
    'asset_input': 'users/SarahMoura/Doutorado/Dados/SerieLandsat',     
    'bnd_int': ['red', 'nir', 'swir1', 'swir2']    
}

def borderRemove (image):
    
    polygon = image.geometry()
    return image.clip(polygon.buffer(-500.0))


def Index_Normalized_Burn (img):
    
    nbrImg = img.expression(
        "float((b('nir') - b('swir2')) / (b('nir') + b('swir2')))").rename('nbr')

    maskNBR = nbrImg.gt(-0.2).add(nbrImg.lt(-0.4))
    maskNBR = maskNBR.gte(1).rename('mask')
    
    baiImg = img.expression(
        "float(1/ ((0.05 - b('nir'))**2 + (0.2 - b('swir2'))**2))").rename('baiml')
    
    birmiImg = img.expression(
        "float((10 * b('swir1')) - (9.8 * b('swir2')) + 2)").rename('mirbi')
    
    img = img.addBands(nbrImg).addBands(baiImg).addBands(birmiImg).addBands(maskNBR)
    
    return img


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

def funct_export_Img(imagem, name_im, geom, indX):    
      
    asset_path = params['asset_output'][indX] + name_im
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



imgCol = ee.ImageCollection(params['asset_input']).sort('system:time_start')
geome = imgCol.geometry()
size_imgC = imgCol.size().getInfo()
raizTam = math.sqrt(size_imgC)
print("get serie of values real  ")
serie_landsat = imgCol.map(lambda img : get_landsatCollection(img))
#// var teste = get_landsatCollection(serie_landsat_Col.first())

serie_landsat_ind = serie_landsat.map(lambda img : Index_Normalized_Burn(img))
# print(serie_landsat.first().bandNames().getInfo())
print("ver imagem 1", serie_landsat_ind.first().bandNames().getInfo())
# est
media_NBR = serie_landsat_ind.select('nbr').mean()
media_BAI = serie_landsat_ind.select('baiml').mean()
media_MIRBI = serie_landsat_ind.select('mirbi').mean()
# //a media do tempo para o dado é  82.5 
ls_tempo = [kk for kk in range(1, size_imgC + 1)]
media_time = np.mean(ls_tempo)
# media_time = 82.5

exportEst = False
if exportEst:
    name_img = 'images_real_medianNBR_portugal_fire'
    funct_export_Img(media_NBR, name_img, geome, '1')
    name_img = 'images_real_medianBAIML_portugal_fire'
    funct_export_Img(media_BAI, name_img, geome, '1')
    name_img = 'images_real_medianMIRBI_portugal_fire'
    funct_export_Img(media_MIRBI, name_img, geome, '1')

    desvioNBR = serie_landsat_ind.select('nbr').reduce(ee.Reducer.stdDev())
    desvioBAI = serie_landsat_ind.select('baiml').reduce(ee.Reducer.stdDev())
    desvioMIRBI = serie_landsat_ind.select('mirbi').reduce(ee.Reducer.stdDev())

    intervaloNBR = ee.Image.constant(1.96 ).multiply(desvioNBR)
    intervaloNBR = intervaloNBR.divide(raizTam)
    intervaloBAI = ee.Image.constant(1.96 ).multiply(desvioBAI)
    intervaloBAI = intervaloBAI.divide(raizTam)
    intervaloMIRBI = ee.Image.constant(1.96 ).multiply(desvioMIRBI)
    intervaloMIRBI = intervaloMIRBI.divide(raizTam)


    name_img = 'images_real_intervaloNBR_portugal_fire'
    funct_export_Img(intervaloNBR, name_img, geome, '1')
    name_img = 'images_real_intervaloBAIML_portugal_fire'
    funct_export_Img(intervaloBAI, name_img, geome, '1')
    name_img = 'images_real_intervaloMIRBI_portugal_fire'
    funct_export_Img(intervaloMIRBI, name_img, geome, '1')

ls_index = serie_landsat_ind.reduceColumns(ee.Reducer.toList(), ['system:index']).get('list').getInfo()
serie_landsat_ind = ee.ImageCollection(serie_landsat_ind)
bndInd = ["nir","nbr",'baiml','mirbi']
bndIndDif = ["dNir","dNBR",'dBAIML','dMIRBI']
for cc, ind in enumerate(ls_index):
    img_temp = serie_landsat_ind.filter(ee.Filter.eq('system:index', ind)).first()
    print("load <==> {} with  ".format(ind)) # , img_temp.size().getInfo()
    # img_temp = ee.Image(ee.List(bndInd).get(0))
    img_temp = ee.Image(img_temp).select(bndInd)
    
    if cc == 0:
        img_dif = img_temp.rename(bndIndDif)
        img_exp = img_temp.addBands(img_dif)
        print('bands to export ', img_exp.bandNames().getInfo())
        funct_export_Img(img_exp, ind, geome, '0')

    else:
        img_dif = img_dif.subtract(img_temp).rename(bndIndDif)
        #dNBRs= NBRpre − NBRpost
        funct_export_Img(img_temp.addBands(img_dif), ind, geome, '0')
        img_dif = img_temp.rename(bndIndDif)