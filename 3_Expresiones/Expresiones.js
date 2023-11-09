var roi =  ee.Geometry.Polygon(
        [[[-74.49237575061288, 4.450326525969174],
          [-74.49237575061288, 4.275054671609539],
          [-74.22870387561288, 4.275054671609539],
          [-74.22870387561288, 4.450326525969174]]], null, false);

var Sentinel2 = ee.ImageCollection("COPERNICUS/S2");

var s2 = Sentinel2.filterDate("2016-01-01","2022-12-31").filterBounds(roi).
  filterMetadata("CLOUDY_PIXEL_PERCENTAGE","less_than",40);
  
  function CloudMaskSentinel(img){
  var qa = img.select('QA60');//Contiene información de cirrus y nubes
  var nubesBitMask = 1 << 10;
  var cirrusBitMask = 1 << 11;
  var mask = qa.bitwiseAnd(nubesBitMask).eq(0)
      .and(qa.bitwiseAnd(cirrusBitMask).eq(0)); // 1 indica nubes y 0 indica condiciones despejadas
  return img.updateMask(mask).divide(10000);//Dividido por el factor de escala
}

function EVI(img){
  var evi = img.expression(
    '2.5 * ((NIR - RED) / (NIR + 6 * RED - 7.5 * BLUE + 1))', {
      'NIR': img.select('B8'),
      'RED': img.select('B4'),
      'BLUE': img.select('B2')
  }).rename("EVI");
  return img.addBands(evi).
    set('system:time_start', img.get('system:time_start'));
}

function cortarImg(img){
  return img.clip(roi);
}

var EVIs2 = s2.map(CloudMaskSentinel).map(EVI).map(cortarImg);

Map.addLayer(EVIs2.select("EVI").first(),{
  "max": 0.9499582904954663,
  "min": 0.010881011758528474,
  "opacity": 1,
  "palette":["0b0b0b","82845c","ffdb4a","34cd08","009c11","0f862c"]
},"EVI");

Map.addLayer(EVIs2.select("EVI").first(),{
  "max": 0.95,
  "min": 0.50,
  "opacity": 1,
  "palette":["000000","00FF00"]
},"EVI 2");