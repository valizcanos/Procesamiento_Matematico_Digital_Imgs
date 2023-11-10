var modis = ee.ImageCollection("MODIS/061/MOD13Q1");
var geometry = 
    /* color: #d63000 */
    /* shown: false */
    /* displayProperties: [
      {
        "type": "rectangle"
      }
    ] */
    ee.Geometry.Polygon(
        [[[-119.94787828645993, 36.678197192004596],
          [-119.94787828645993, 36.35149768417054],
          [-119.17883531770993, 36.35149768417054],
          [-119.17883531770993, 36.678197192004596]]], null, false);


function cortar(img){
  return img.clip(geometry);
}

var indices = modis.filterDate("2015-01-01","2018-12-31").filterBounds(geometry)
  .map(cortar).select(["NDVI"]);

var primera= indices.first();

Map.centerObject(geometry,10);
Map.addLayer(primera,{"min":5000,"max":8000, "palette":["000000","#2bff0c"]},"NDVI primero");

var minimo = primera.reduceRegion({
  reducer: ee.Reducer.min(),
  geometry: geometry,
  scale: 250,
  maxPixels: 1e9
});

print("Mínimo:",minimo);

var maximo = primera.reduceRegion({
  reducer: ee.Reducer.max(),
  geometry: geometry,
  scale: 250,
  maxPixels: 1e9
});

print("Máximo:", maximo);

var promedio = primera.reduceRegion({
  reducer: ee.Reducer.mean(),
  geometry: geometry,
  scale: 250,
  maxPixels: 1e9
});

print("Promedio:", promedio);

var mediana = primera.reduceRegion({
  reducer: ee.Reducer.median(),
  geometry: geometry,
  scale: 250,
  maxPixels: 1e9
});

print("Mediana:", mediana);

var moda = primera.reduceRegion({
  reducer: ee.Reducer.mode(),
  geometry: geometry,
  scale: 250,
  maxPixels: 1e9
});

print("Moda:", moda);

var desvest = primera.reduceRegion({
  reducer: ee.Reducer.stdDev(),
  geometry: geometry,
  scale: 250,
  maxPixels: 1e9
});

print("Desviación estándar:", desvest);

var varianza = primera.reduceRegion({
  reducer: ee.Reducer.variance(),
  geometry: geometry,
  scale: 250,
  maxPixels: 1e9
});

print("Varianza:", varianza);

var Histograma =
    ui.Chart.image.histogram({image: primera.select(["NDVI"]), region: geometry, scale: 250})
        .setSeriesNames(['NDVI'])
        .setOptions({
          title: 'Histograma de valores NDVI',
          hAxis: {
            title: 'Indice (x1e-4)',
            titleTextStyle: {italic: false, bold: true},
          },
          vAxis:
              {title: 'Frecuencia', titleTextStyle: {italic: false, bold: true}},
          colors: ['cf513e']
        });
print(Histograma);