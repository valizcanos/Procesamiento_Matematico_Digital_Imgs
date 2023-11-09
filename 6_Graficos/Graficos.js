var vegIndices = ee.ImageCollection("MODIS/006/MOD13A1");
var cana = ee.Feature(
        ee.Geometry.Polygon(
            [[[-76.44866244033143, 3.1556374808532985],
              [-76.44866244033143, 3.154223420945179],
              [-76.44668833449647, 3.154223420945179],
              [-76.44668833449647, 3.1556374808532985]]], null, false),
        {
          "cultivo": "caña",
          "system:index": "0"
        });
var arroz = ee.Feature(
        ee.Geometry.Polygon(
            [[[-76.49846011930525, 3.2075019310010586],
              [-76.49846011930525, 3.206216486741138],
              [-76.4968293362242, 3.206216486741138],
              [-76.4968293362242, 3.2075019310010586]]], null, false),
        {
          "cultivo": "arroz",
          "system:index": "0"
        });

var coords = /* color: #0b4a8b */ee.Geometry.Point([-76.46579512127367, 3.17825347128993]);
    
var geometry = ee.Geometry.Polygon(
        [[[-76.49906705374269, 3.208309324350317],
          [-76.49906705374269, 3.1539765215114586],
          [-76.44585202688722, 3.1539765215114586],
          [-76.44585202688722, 3.208309324350317]]], null, false);



// Tipos de gráficos que ofrece earth engine:
//'ScatterChart'
//'LineChart'
//'ColumnChart'
//'BarChart'
//'PieChart'
//'AreaChart'

/*-------------------------------------------------------------------------------*/
/*GRÁFICOS CON IMAGENES*/

var cultivos = ee.FeatureCollection(ee.List([cana,arroz]));

var indices = vegIndices.filterDate("2015-01-01","2016-12-31").filterBounds(coords);

var anios = ee.List.sequence(2015, 2022);
var meses = ee.List.sequence(1, 12);



var IndMeses = ee.ImageCollection.fromImages(
  meses.map(function (m) {
    return indices
      .filter(ee.Filter.calendarRange(m, m, 'month'))
      .mean().multiply(0.0001)
      .set('month', m);
  })
);

print(IndMeses.select(["NDVI","EVI"]).toBands());

Map.centerObject(coords,9);

//Grafico por region tipo columna:

var regionCol =
    ui.Chart.image
        .byRegion({
          image: IndMeses.select(["NDVI"]).toBands(),//convertir las imagenes temporales a bandas
          regions: cultivos,
          reducer: ee.Reducer.mean(),
          scale: 500,
          xProperty: 'cultivo'
        }).setSeriesNames([
          '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'
        ]).setChartType('ColumnChart')
        .setOptions({
          title: 'NDVI promedio mensual por cultivo',
          hAxis:
              {title: 'Cultivo - tipo', titleTextStyle: {italic: false, bold: true}},
          vAxis: {
            title: 'NDVI',
            titleTextStyle: {italic: false, bold: true}
          },
          colors: [
            '604791', '1d6b99', '39a8a7', '0f8755', '76b349', 'f0af07',
            'e37d05', 'cf513e', '96356f', '724173', '9c4f97', '696969'
          ]
        });

print(regionCol);

//Grafico por region tipo linea:

var regionLin =
    ui.Chart.image
        .byRegion({
          image: IndMeses.select(["NDVI"]).toBands(),//convertir las imagenes temporales a bandas
          regions: cultivos,
          reducer: ee.Reducer.mean(),
          scale: 500,
          xProperty: 'cultivo'
        }).setSeriesNames([
          '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'
        ]).setChartType('LineChart')
        .setOptions({
          title: 'NDVI promedio mensual por cultivo',
          hAxis:
              {title: 'Cultivo - tipo', titleTextStyle: {italic: false, bold: true}},
          vAxis: {
            title: 'NDVI',
            titleTextStyle: {italic: false, bold: true}
          },
          colors: [
            '604791', '1d6b99', '39a8a7', '0f8755', '76b349', 'f0af07',
            'e37d05', 'cf513e', '96356f', '724173', '9c4f97', '696969'
          ]
        });

print(regionLin);





//Grafico por region tipo dispersión:

var samp = indices.select(["EVI"]).mean().multiply(0.0001).sample(
    {region: geometry, scale: 500, numPixels: 500, geometries: true});
    
var regionScat = ui.Chart.image
                .byRegion({
                  image: IndMeses.select(["NDVI"]).toBands(),//convertir las imagenes temporales a bandas
                  regions: samp,
                  reducer: ee.Reducer.mean(),
                  scale: 500,
                  xProperty: 'EVI'
                })
                .setSeriesNames(['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'])
                .setChartType('ScatterChart')
                .setOptions({
                  title: 'Relación NDVI vs EVI',
                  hAxis: {
                    title: 'EVI',
                    titleTextStyle: {italic: false, bold: true}
                  },
                  vAxis: {
                    title: 'NDVI',
                    titleTextStyle: {italic: false, bold: true}
                  },
                  pointSize: 2,
                  dataOpacity: 0.6,
                  colors: ['604791', '1d6b99', '39a8a7', '0f8755', '76b349', 'f0af07',
            'e37d05', 'cf513e', '96356f', '724173', '9c4f97', '696969'],
                });
print(regionScat);

//Histograma:

var Histograma =
    ui.Chart.image.histogram({image: indices.select(["NDVI","EVI"]).mean(), region: geometry, scale: 500})
        .setSeriesNames(['NDVI', 'EVI'])
        .setOptions({
          title: 'Histograma de valores EVI y NDVI',
          hAxis: {
            title: 'Indice (x1e-4)',
            titleTextStyle: {italic: false, bold: true},
          },
          vAxis:
              {title: 'Frecuencia', titleTextStyle: {italic: false, bold: true}},
          colors: ['cf513e', '1d6b99']
        });
print(Histograma);
/*-------------------------------------------------------------------------------*/
// Animación serie de tiempo NDVI

var Colombia = ee.FeatureCollection('USDOS/LSIB_SIMPLE/2017').filter(ee.Filter.eq('country_na', 'Colombia')).geometry();

var NDVIcol = indices.map(function(image){return image.clip(geometry);});

// Definir parámetros de la visualización
var vis = { 
  palette: [
    'FFFFFF', 'CE7E45', 'DF923D', 'F1B555', 'FCD163', '99B718', '74A901',
    '66A000', '529400', '3E8601', '207401', '056201', '004C00', '023B01',
    '012E01', '011D01', '011301'],
  crs: 'EPSG:4326',
  min: 0.0,
  max: 9000.0, // Seleccionar valores de píxel
  framesPerSecond: 2, // Seleccionar las escenas por segundo (más escenas, más rápido)
  dimensions: '600',}; // Dimensión máxima del tamaño del gif


var gif = NDVIcol.select("NDVI").getVideoThumbURL(vis);
print(gif);

/*-------------------------------------------------------------------------------*/
//CONSULTAS:

//  https://developers.google.com/earth-engine/guides/charts_image
//  https://developers.google.com/earth-engine/guides/charts_style
//  https://www.gisandbeers.com/frames-animaciones-en-google-earth-engine/