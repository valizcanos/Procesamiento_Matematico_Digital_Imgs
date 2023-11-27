var chirps = ee.ImageCollection("UCSB-CHG/CHIRPS/DAILY");
var roi = 
    /* color: #d63000 */
    /* displayProperties: [
      {
        "type": "rectangle"
      }
    ] */
    ee.Geometry.Polygon(
        [[[-76.81747292218486, 5.89020880493381],
          [-76.81747292218486, 5.540394472900599],
          [-76.49886940655986, 5.540394472900599],
          [-76.49886940655986, 5.89020880493381]]], null, false);

/*=============================================================================================*/
function maskCorte(img){return img.clip(roi)}

var lluviasDia = chirps.select("precipitation").filterDate("1981-01-01","2022-12-31").filterBounds(roi).map(maskCorte);


print("Tamaño px de chirps", lluviasDia.first().projection().nominalScale(), " metros" );

var anios = ee.List.sequence(1981,2022);
var meses = ee.List.sequence(1,12);

var lluviasMes = ee.ImageCollection.fromImages(
  
  anios.map(function(a){
    return meses.map(function(m){
      var precM = lluviasDia.filter(ee.Filter.calendarRange(a, a, "year")).filter(ee.Filter.calendarRange(m,m,"month")).sum();
      return precM.set("year",a).set("month",m).set("system:time_start", ee.Date.fromYMD(a,m,1));
    });
  }).flatten() //Obligatorio aplanamiento del array de imagenes
  );
  
print("Lluvias mensales: ", lluviasMes);

var lluviasAnio = ee.ImageCollection.fromImages(
  
  anios.map(function(a){
    var precAnios = lluviasMes.filter(ee.Filter.calendarRange(a,a,"year")).sum();
    return precAnios.set("year",a).set("system:time_start", ee.Date.fromYMD(a,1,1));
  }).flatten()
  
  );


var promMes =  ee.ImageCollection.fromImages(
  meses.map(function (m) {
    var w = lluviasMes.filter(ee.Filter.eq('month', m)).mean();
    return w.set('month', m)
            .set('system:time_start',ee.Date.fromYMD(1, m, 1));
  }).flatten()
);


print("promedio mes multianual: ", promMes);

var seriesMes = ui.Chart.image.series({
  "imageCollection":lluviasMes, 
  "region": roi, 
  "reducer": ee.Reducer.mean(), 
  "scale":5565.974539663679, 
  "xProperty": "system:time_start"}).setOptions({
    "lineWidth":1,
    "pointSize":2,
    "vAxis":{title:"Precipitacion mensual acumulada (mm)",  titleTextStyle:{fontName: 'arial', fontSize: 14, italic: false, bold: true}},
    "hAxis":{title:"Fecha",  titleTextStyle:{fontName: 'arial', fontSize: 14, italic: false, bold: true}},
    "series":{0: {color: 'red'}},
    "trendlines": {0: {color: 'blue'}}
  });
  
print(seriesMes);


var seriesAnio = ui.Chart.image.series({
  "imageCollection":lluviasAnio, 
  "region": roi, 
  "reducer": ee.Reducer.mean(), 
  "scale":5565.974539663679, 
  "xProperty": "system:time_start"}).setOptions({
    "lineWidth":1,
    "pointSize":2,
    "vAxis":{title:"Precipitacion anual acumulada (mm)",  titleTextStyle:{fontName: 'arial', fontSize: 14, italic: false, bold: true}},
    "hAxis":{title:"Fecha",  titleTextStyle:{fontName: 'arial', fontSize: 14, italic: false, bold: true}},
    "series":{0: {color: 'red'}},
    "trendlines": {0: {color: 'blue'}}
  });
  
print(seriesAnio);

var multianualMes = ui.Chart.image.series({
  "imageCollection":promMes, 
  "region": roi, 
  "reducer": ee.Reducer.mean(), 
  "scale":5565.974539663679, 
  "xProperty": "month"}).setChartType('ColumnChart');

print(multianualMes);
