var LS8 = ee.ImageCollection("LANDSAT/LC08/C02/T1_TOA");
var Sentinel2 = ee.ImageCollection("COPERNICUS/S2");
var roi = ee.Geometry.Polygon(
        [[[-74.49237575061288, 4.450326525969174],
          [-74.49237575061288, 4.275054671609539],
          [-74.22870387561288, 4.275054671609539],
          [-74.22870387561288, 4.450326525969174]]], null, false);



var l8 = LS8.filterDate("2016-01-01","2022-12-31").filterBounds(roi).
  filterMetadata("CLOUD_COVER","less_than",40);
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

function CloudMaskLS08(img){
  var qa = img.select("QA_PIXEL");//Contiene información de cirrus y nubes
  var nubesBitMask = 1 << 3;
  var sombraBitMask = 1 << 4; 
  var mask = qa.bitwiseAnd(nubesBitMask).eq(0)
      .and(qa.bitwiseAnd(sombraBitMask).eq(0)); // 1 indica nubes y 0 indica condiciones despejadas
  return img.updateMask(mask);
}

/*El operador << en Google Earth Engine es un operador de desplazamiento a la izquierda.
Este operador desplaza los bits de un número a la izquierda por una cierta cantidad 
de posiciones. Por ejemplo, si tienes el número 1 (que en binario es 0001) 
y usas el operador de desplazamiento a la izquierda para desplazar los bits 
una posición a la izquierda (1 << 1), obtendrías el número 2 (que en binario es 0010)*/

/*La función bitwiseAnd en Google Earth Engine es una operación de bit a bit. 
Esta función toma dos imágenes como entrada y realiza una operación AND de bit a bit 
en cada píxel de las imágenes. En una operación AND de bit a bit, cada bit de la 
primera imagen se compara con el bit correspondiente de la segunda imagen. 
Si ambos bits son 1, el bit resultante es 1. De lo contrario, el bit resultante es 0.
Por ejemplo, si tienes dos imágenes con los siguientes valores de píxeles:
Imagen 1: 1010
Imagen 2: 1100
La operación bitwiseAnd daría como resultado: 
1000. Esto se debe a que el primer y tercer bit de ambas imágenes son 1, 
mientras que el segundo y cuarto bit no son 0*/

function cortarImg(img){
  return img.clip(roi);
}

var SentinelMask = s2.map(CloudMaskSentinel).map(cortarImg);
var LandsatMask = l8.map(CloudMaskLS08).map(cortarImg);

Map.centerObject(roi, 10);

Map.addLayer(SentinelMask.first().select(["B8","B4","B3"]), 
{"gamma": 1,
"max": 0.4582,
"min": 0.0306,
"opacity": 1}, 
"Sentinel 2");

Map.addLayer(LandsatMask.first().select(["B5","B4","B3"]), {"gamma": 1,
"max": 0.539579451084137,
"min": 0.05147523432970047,
"opacity": 1}, "Landsat 8");



//GRÁFICAS CON PORCENTAJES DE NUBES EN LAS SRIES TEMPORALES DE SENTINEL Y LANDSAT

function addicionarBandasS2(image) {
  var nubesBitMask  = 1 << 10; 
  var cirrusBitMask = 1 << 11;
  
  var nubes     = image.eq(nubesBitMask).select("QA60").rename('nubes');
  var cirrus    = image.eq(cirrusBitMask).select("QA60").rename('cirrus');
  var despejado = image.eq(0).select("QA60").rename('despejado'); 

  return image.addBands([nubes,cirrus,despejado]).
    set('system:time_start', image.get('system:time_start'));
}

var s2Nubes= s2.map(addicionarBandasS2).select(['nubes',"cirrus","despejado"]);


var porcntajeNubesS2 = ui.Chart.image.series(
    s2Nubes, roi, ee.Reducer.sum(), 30, 'system:time_start')
        .setChartType('ColumnChart')
        .setOptions({
          isStacked: 'Porcentaje',
          title: 'Nubosidad Vs Tiempo en series de Sentinel-2',
          vAxis: {title: 'Distribución del área de nubes (%)'},
          lineWidth: 1,
          pointSize: 4,
          series: {
            0: {color: 'FF0000'},
            1: {color: '00FF00'}, 
            2: {color: '0000FF'}  
}});
print(porcntajeNubesS2);


function addicionarBandasL8(image) {
  var nubesBitMask = 1 << 3;
  var sombraBitMask = 1 << 4;
  
  var nubes     = image.eq(nubesBitMask).select("QA_PIXEL").rename('nubes');
  var sombras    = image.eq(sombraBitMask).select("QA_PIXEL").rename('sombras');
  var despejado = image.eq(0).select("QA_PIXEL").rename('despejado'); 

  return image.addBands([nubes,sombras,despejado]).
    set('system:time_start', image.get('system:time_start'));
}

var l8Nubes= l8.map(addicionarBandasL8).select(['nubes',"sombras","despejado"]);

var porcntajeNubesL8 = ui.Chart.image.series(
    l8Nubes, roi, ee.Reducer.sum(), 30, 'system:time_start')
        .setChartType('ColumnChart')
        .setOptions({
          isStacked: 'Porcentaje',
          title: 'Nubosidad Vs Tiempo en series de Landsat08',
          vAxis: {title: 'Distribución del área de nubes (%)'},
          lineWidth: 1,
          pointSize: 4,
          series: {
            0: {color: 'FF0000'},
            1: {color: '00FF00'}, 
            2: {color: '0000FF'}  
}});
print(porcntajeNubesL8);
