var roi = ee.Geometry.Polygon(
        [[[-72.96053679739609, 11.537470610922956],
          [-72.96053679739609, 11.16046847570676],
          [-72.47713835989609, 11.16046847570676],
          [-72.47713835989609, 11.537470610922956]]], null, false);
var L8 = ee.ImageCollection("LANDSAT/LC08/C02/T1_TOA");



function cortarImg(img){
  return img.clip(roi);
}

function CloudMaskLS08(img){
  var qa = img.select("QA_PIXEL");//Contiene información de cirrus y nubes
  var nubesBitMask = 1 << 3;
  var sombraBitMask = 1 << 4; 
  var mask = qa.bitwiseAnd(nubesBitMask).eq(0)
      .and(qa.bitwiseAnd(sombraBitMask).eq(0)); // 1 indica nubes y 0 indica condiciones despejadas
  return img.updateMask(mask);
}

var l8f = L8.filterDate("2015-01-01","2015-12-31").filterBounds(roi).map(cortarImg).map(CloudMaskLS08);
Map.centerObject(roi,10);

Map.addLayer(l8f.median().select(["B5","B4","B3"]),{},"mediana");
Map.addLayer(l8f.mean().select(["B5","B4","B3"]),{},"promedio");
Map.addLayer(l8f.min().select(["B5","B4","B3"]),{},"mínimo");
Map.addLayer(l8f.max().select(["B5","B4","B3"]),{},"máximo");
Map.addLayer(l8f.reduce(ee.Reducer.stdDev()),{},"desviación estándar");
Map.addLayer(l8f.reduce(ee.Reducer.variance()),{},"varianza");
Map.addLayer(l8f.reduce(ee.Reducer.minMax()),{},"MinMax");