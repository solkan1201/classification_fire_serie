#-*- coding utf-8 -*-
import ee
import os
import sys
import copy
import math
import numpy as np
import pandas as pd
from datetime import datetime
# import arqNewparamcopy as aparam
try:
    ee.Initialize()
    print('The Earth Engine package initialized successfully!')
except ee.EEException as e:
    print('The Earth Engine package failed to initialize!')
except:
    print("Unexpected error:", sys.exc_info()[0])
    raise

def addVariablesIndependents(image):
    # Compute time in fractional years since the epoch.
    date = ee.Date(image.get('system:time_start'))
    years = date.difference(ee.Date('2001-01-01'), 'year')
    timeRadians = ee.Number(years).multiply(ee.Number(2 * math.pi))

    return image.addBands(ee.Image(years).rename('t').float()).addBands(
                    ee.Image(timeRadians).cos().rename('cos')).addBands(
                        ee.Image(timeRadians).sin().rename('sin')).addBands(                    
                            ee.Image.constant(1))

params = {
    # asset_output: 'users/CartasSol/temporal/',
    'asset_output': 'users/shdoutorado/serieHarmonica/',
    # 'asset_input': 'users/sdoutorado/serie_indexs_withDif_inLandsat', 
    'asset_input': 'users/sdoutorado/serie_indexs_withDif_inLandsat',     
      
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

imgCol = ee.ImageCollection(params['asset_input']).sort('system:time_start')
geome = imgCol.geometry()
size_imgC = imgCol.size().getInfo()
print("tamanho image collection ", size_imgC)

imColconst = imgCol.map(lambda img : addVariablesIndependents(img))

print("see all bands now ", imColconst.first().bandNames().getInfo())


# lsIndexImg = imgCol.reduceColumns(ee.Reducer.toList(), ['system:index']).get('list').getInfo()
# d1 = datetime(2001,1,1)
# lst_t = []
# lsdif = []
# for inde in lsIndexImg:
#     # print(inde)
#     datatext = inde.split("_")[2]
#     year = int(datatext[:4])
#     mes = int(datatext[4:6])
#     dia = int(datatext[6:])
#     d2 = datetime(year, mes, dia)
#     # print(d2)
#     diff = d2 - d1
#     difDay = diff.days / 365
#     lsdif.append(diff.days)
#     lst_t.append(difDay)

# vals_radn = [ kk *  2 * np.pi for kk in lst_t]
# print("numero de dados de lista ", len(vals_radn))
# print("numero de dados de lista ", len(lst_t))
# lsVal_s = np.sin(vals_radn)
# lsval_c = np.cos(vals_radn)

# dictPd = {
#     'difDay': lsdif,
#     'lsDays': lst_t,
#     'lsPI_day': vals_radn,
#     'sin_day': lsVal_s,
#     'cos_day': lsval_c
# }

# df = pd.DataFrame.from_dict(dictPd)

# print(df.to_string())

dict_indices = {
    'NIR': 'nir',
    'NBR': 'nbr',
    'BAIML': 'baiml',
    'MIRBI': 'mirbi',
    'dNIR': 'nir',
    'dNBR': 'dNBR',
    'dBAIML': 'dBAIML',
    'dMIRBI': 'dMIRBI'
};


harmonicIndV = ['constant', 't', 'cos', 'sin']
numVarInd = len(harmonicIndV)
harmonicIndV = ee.List(harmonicIndV)
lsAllVar = ['constant', 't', 'cos', 'sin', 'nir']
harmonicTrendM_nir = imColconst.select(lsAllVar).reduce(
                                ee.Reducer.linearRegression(numVarInd, 1))
print("coeficientes  == ", harmonicTrendM_nir.getInfo())

lsAllVar = ['constant', 't', 'cos', 'sin', 'nbr']
harmonicTrendM_nbr = imColconst.select(lsAllVar).reduce(
                                ee.Reducer.linearRegression(numVarInd, 1))
# lsAllVar = ['constant', 't', 'cos', 'sin', 'baiml']
# harmonicTrendM_baiml = imColconst.select(lsAllVar).reduce(
#                                 ee.Reducer.linearRegression(numVarInd, 1))
lsAllVar = ['constant', 't', 'cos', 'sin', 'mirbi']
harmonicTrendM_mirbi = imColconst.select(lsAllVar).reduce(
                                ee.Reducer.linearRegression(numVarInd, 1))
# lsAllVar = ['constant', 't', 'cos', 'sin', 'dNir']
# harmonicTrendM_dNIR = imColconst.select(lsAllVar).reduce(
#                                 ee.Reducer.linearRegression(numVarInd, 1))
lsAllVar = ['constant', 't', 'cos', 'sin', 'dNBR']
harmonicTrendM_dNBR = imColconst.select(lsAllVar).reduce(
                                ee.Reducer.linearRegression(numVarInd, 1))
# lsAllVar = ['constant', 't', 'cos', 'sin', 'dBAIML']
# harmonicTrendM_dBAIML = imColconst.select(lsAllVar).reduce(
#                                 ee.Reducer.linearRegression(numVarInd, 1))
# lsAllVar = ['constant', 't', 'cos', 'sin', 'dMIRBI']
# harmonicTrendM_dMIRBI = imColconst.select(lsAllVar).reduce(
#                                 ee.Reducer.linearRegression(numVarInd, 1))
# print("harmonicTrendM_dMIRBI", harmonicTrendM_dMIRBI)

#  Turn the array image into a multi-band image of coefficients .
harmonicTrendCoef_nir = harmonicTrendM_nir.select('coefficients').arrayProject(
                                        [0]).arrayFlatten([harmonicIndV])

harmonicTrendCoef_nbr = harmonicTrendM_nbr.select('coefficients').arrayProject(
                                        [0]).arrayFlatten([harmonicIndV])

# harmonicTrendCoef_baiml = harmonicTrendM_baiml.select('coefficients').arrayProject(
#                                         [0]).arrayFlatten([harmonicIndV])

harmonicTrendCoef_mirbi = harmonicTrendM_mirbi.select('coefficients').arrayProject(
                                        [0]).arrayFlatten([harmonicIndV])

# harmonicTrendCoef_dNIR = harmonicTrendM_dNIR.select('coefficients').arrayProject(
#                                         [0]).arrayFlatten([harmonicIndV])

harmonicTrendCoef_dNBR = harmonicTrendM_dNBR.select('coefficients').arrayProject(
                                        [0]).arrayFlatten([harmonicIndV])

# harmonicTrendCoef_dBAIML = harmonicTrendM_dBAIML.select('coefficients').arrayProject(
#                                         [0]).arrayFlatten([harmonicIndV])
# harmonicTrendCoef_dMIRBI = harmonicTrendM_dMIRBI.select('coefficients').arrayProject(
#                                         [0]).arrayFlatten([harmonicIndV])
  
#     print("harmonicTrendCoefficientsM" , harmonicTrendCoefficientsM)
        
#/////////////////////////////////////////////////////////////////////////////////////
lsIndexImg = imgCol.reduceColumns(ee.Reducer.toList(), ['system:index']).get('list').getInfo()


#     // Compute fitted values Modis.
#     var fittedHarmonicM = harmonicLandsatM.map(
#                                 function(image) {
#                                         return image.addBands(
#                                                         image.select(harmonicIndependentsM)
#                                                             .multiply(harmonicTrendCoefficientsM)
#                                                             .reduce('sum')
#                                                             .rename('fitted')
#                                                     );
#                                     });






ls_variaveis = ['nir', 'nbr',  'mirbi',  'dNBR',]  # 'baiml','dNir', 'dBAIML', 'dMIRBI'
ls_varFitted = ['nir_fitted', 'nbr_fitted',  'mirbi_fitted', 'dNBR_fitted']
                # 'baiml_fitted','dNIR_fitted',, 'dBAIML_fitted', 'dMIRBI_fitted'

for cc, indexs in enumerate(lsIndexImg):
    imgTemp = imColconst.filter(ee.Filter.eq('system:index', indexs)).first()
    if cc == 0:
        print("see bands ", imgTemp.bandNames().getInfo())
    
    for variav in ls_variaveis:
        if variav ==  'nir':
            # print('fitted NIR')
            imFitted = imgTemp.select(harmonicIndV).multiply(harmonicTrendCoef_nir).reduce('sum')
            imFitted = imFitted.rename('nir_fitted')
            imgTemp = imgTemp.addBands(imFitted)
        elif variav ==  'nbr':
            # print('fitted NBR')
            imFitted = imgTemp.select(harmonicIndV).multiply(harmonicTrendCoef_nbr).reduce('sum')
            imFitted = imFitted.rename('nbr_fitted')
            imgTemp = imgTemp.addBands(imFitted)
        # elif variav ==  'baiml':
        #     # print('fitted BAIML')
        #     imFitted = imgTemp.select(variav).multiply(harmonicTrendCoef_baiml).reduce('sum')
        #     imFitted = imFitted.rename('baiml_fitted')
        #     imgTemp = imgTemp.addBands(imFitted)
        elif variav ==  'mirbi':
            # print('fitted MIRBI')
            imFitted = imgTemp.select(harmonicIndV).multiply(harmonicTrendCoef_mirbi).reduce('sum')
            imFitted = imFitted.rename('mirbi_fitted')
            imgTemp = imgTemp.addBands(imFitted)
        # elif variav ==  'dNir':
        #     imFitted = imgTemp.select(variav).multiply(harmonicTrendCoef_dNIR).reduce('sum')
        #     imFitted = imFitted.rename('dNIR_fitted')
        #     imgTemp = imgTemp.addBands(imFitted)
        elif variav ==  'dNBR':
            imFitted = imgTemp.select(harmonicIndV).multiply(harmonicTrendCoef_dNBR).reduce('sum')
            imFitted = imFitted.rename('dNBR_fitted')
            imgTemp = imgTemp.addBands(imFitted)
        # elif variav ==  'dBAIML':
        #     imFitted = imgTemp.select(variav).multiply(harmonicTrendCoef_dBAIML).reduce('sum')
        #     imFitted = imFitted.rename('dBAIML_fitted')
        #     imgTemp = imgTemp.addBands(imFitted)
        # elif variav ==  'dMIRBI':
        #     imFitted = imgTemp.select(variav).multiply(harmonicTrendCoef_dMIRBI).reduce('sum')
        #     imFitted = imFitted.rename('dMIRBI_fitted')
            # imgTemp = imgTemp.addBands(imFitted)


    imgTemp = imgTemp.select(ls_varFitted)
    if cc == 0:
        print("see bands ", imgTemp.bandNames().getInfo())
    funct_export_Img(imgTemp, indexs, geome)