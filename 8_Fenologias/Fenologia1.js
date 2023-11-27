var Modis = ee.ImageCollection("MODIS/061/MOD13Q1");
var zona = /* color: #d63000 */ 
    /* shown: false */
    /* displayProperties: [{"type": "rectangle"}] */
    ee.Geometry.Polygon(
        [[[-94.6556612369168, 29.80554580567742],
          [-94.6556612369168, 29.62843263789202],
          [-94.18942893711211, 29.62843263789202],
          [-94.18942893711211, 29.80554580567742]]], null, false);
var geometry = 
    /* color: #98ff00 */
    /* shown: false */
    ee.Geometry.Point([-102.46797051253169, 32.92294165562775]);

/*===================================================================================================*/

var ndvi = Modis.select("NDVI").
  filterDate("2015-01-01","2022-12-31").
  filterBounds(zona).
  map(function(img){return img.multiply(0.0001).copyProperties(img,["system:time_start"])});

var evi = Modis.select("EVI").
  filterDate("2015-01-01","2022-12-31").
  filterBounds(zona).
  map(function(img){return img.multiply(0.0001).copyProperties(img,['system:time_start'])});

function lswi(img){
  var Lswi = img.expression('(NIR - MIR) / (NIR + MIR)', {
      'NIR': img.select('sur_refl_b02'),
      'MIR': img.select('sur_refl_b07')
  }).rename("LSWI");
  return img.addBands(Lswi).
    set('system:time_start', img.get('system:time_start'));
}

var lswI = Modis.map(lswi).select("LSWI").
  filterDate("2015-01-01","2022-12-31").
  filterBounds(zona);

var Indices = evi.combine(ndvi);
var Indices = Indices.combine(lswI);
print(Indices);

//Fecha de siembra en Marzo y fecha de inundacion en febrero

var febrero = Indices.filter(ee.Filter.calendarRange(2, 2, "month"));

function inundacion(img){
  var zonaI = img.select("LSWI").gt(img.select("EVI")).or(img.select("LSWI").gt(img.select("NDVI")));
  return zonaI;
}

var ZonasInundadas = febrero.map(inundacion);

/*----------------------------------------------------------------------------*/
//GRÁFICOS

var eviPlot = ui.Chart.image.doySeries({
  "imageCollection":evi, 
  "region":zona, 
  "regionReducer":ee.Reducer.mean(), 
  "scale":250, 
  "yearReducer":ee.Reducer.mean(), 
  "startDay":1, 
  "endDay":366}).setOptions({
    "title":"EVI",
    "hAxis":{title:"Día del año", titleTextStyle:{fontName: 'arial', fontSize: 14, italic: false, bold: true}},
    "vAxis":{title:"EVI", titleTextStyle:{fontName: 'arial', fontSize: 14, italic: false, bold: true}}
  });


print(eviPlot);

var ndviPlot = ui.Chart.image.doySeries({
  "imageCollection":ndvi, 
  "region":zona, 
  "regionReducer":ee.Reducer.mean(), 
  "scale":250, 
  "yearReducer":ee.Reducer.mean(), 
  "startDay":1, 
  "endDay":366}).setOptions({
    "title":"NDVI",
    "hAxis":{title:"Día del año", titleTextStyle:{fontName: 'arial', fontSize: 14, italic: false, bold: true}},
    "vAxis":{title:"NDVI", titleTextStyle:{fontName: 'arial', fontSize: 14, italic: false, bold: true}}
  });

print(ndviPlot);

var lswiPlot = ui.Chart.image.doySeries({
  "imageCollection":lswI, 
  "region":zona, 
  "regionReducer":ee.Reducer.mean(), 
  "scale":250, 
  "yearReducer":ee.Reducer.mean(), 
  "startDay":1, 
  "endDay":366}).setOptions({
    "title":"LSWI",
    "hAxis":{title:"Día del año", titleTextStyle:{fontName: 'arial', fontSize: 14, italic: false, bold: true}},
    "vAxis":{title:"LSWI", titleTextStyle:{fontName: 'arial', fontSize: 14, italic: false, bold: true}}
  });

print(lswiPlot);

var indices = ui.Chart.image.doySeries({
  "imageCollection":Indices.select(["EVI","NDVI","LSWI"]), 
  "region":zona, 
  "regionReducer":ee.Reducer.mean(), 
  "scale":250, 
  "yearReducer":ee.Reducer.mean(), 
  "startDay":1, 
  "endDay":366
}).setOptions({
    "title":"Índices: EVI, NDVI y LSWI",
    "hAxis":{title:"Día del año", titleTextStyle:{fontName: 'arial', fontSize: 14, italic: false, bold: true}},
    "vAxis":{title:"Índices", titleTextStyle:{fontName: 'arial', fontSize: 14, italic: false, bold: true}},
    "series":{
      0: {color: 'red'},
      1:{color: 'green'},
      2:{color:'blue'}
    }
  });

print(indices);

var seriesT = ui.Chart.image.series({
  "imageCollection":Indices, 
  "region":zona, 
  "reducer":ee.Reducer.mean(), 
  "scale":250, 
  "xProperty": "system:time_start"}).setOptions({
    "lineWidth":1,
    "pointSize":2,
    "hAxis":{title:"Tiempo", titleTextStyle:{fontName:"timesNewRoman", fontSize:14}},
    "vAxis":{title:"Índices",titleTextStyle:{fontName:"timesNewRoman", fontSize:14}},
    "series":{
      0: {color: 'red'},
      1:{color: 'green'},
      2:{color:'blue'}}
    });
print(seriesT);
/*----------------------------------------------------------------------------*/
//CAPAS

Map.centerObject(zona,12);
Map.addLayer(evi,{},"evi");
Map.addLayer(ndvi,{},"ndvi");
Map.addLayer(lswI,{},"lswi");
Map.addLayer(ZonasInundadas.mean().clip(zona),{"min":0, "max":1, "palette":["#ffff00","#0000ff"]},"Inundacion");