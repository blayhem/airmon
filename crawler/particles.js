const https = require('https');
const http = require('http');

function processData(rows, station) {

  let headers = rows[0].split(';')
  let hour = new Date().getHours()
  let index = headers.indexOf('H' + hour)

  // const station = '49'
  let filtered = rows.filter(r => r.split(';')[2] == station);

  // console.log(rows[0])
  // console.log(filtered)

  const magnitudes = {
    '1': 'SO2',
    '6': 'CO',
    '7': 'NO',
    '8': 'NO2',
    '9': 'Particulas<2.5um',
    '10': 'Particulas<10um',
    '12': 'NOx',
    '14': 'O3',
    '20': 'Tolueno',
    '30': 'Benceno',
    '35': 'Etilbenceno',
    '37': 'Metaxileno',
    '38': 'Paraxileno',
    '39': 'Ortoxileno',
    '42': 'Hidrocarburos',
    '43': 'Metano CH4',
    '44': 'Hexano'
  }

  day = [];
  while(day.length<24){
    day.push([])
  };

  filtered.map((row, i) => {

    attr = row.split(";")
    attr
      .slice(8)
      .filter(v => !isNaN(v))
      .map((value, j) =>{
        particula = magnitudes[attr[3]]
        day[j].push({ [particula]: value })
        // console.log("fila:", i, "hora:", j+1, magnitudes[attr[3]], value)
    });
  });

  /*
  * printing
  */

  console.log(`Data for ${zones[station]}`)

  day.map((d, i) => {
    // convert to str
    str = d
      .slice(0,6) //remove this to avoid filtering some variables (too much noise)
      .reduce((a,b) => {
        values = Object.entries(b)
        return `${a}${values[0][0]}: ${values[0][1]} umg. `
      }, `${i}h\t `)
    console.log(str, "etc")
  });

  /*
  console.log('last data:')
  filtered.map((row) => {
    let attr = row.split(';')
    console.log(magnitudes[attr[3]] + ': ' + attr[index] + ' ug/m3')
  })
  */
}

function particles(station = '8') {
  let options = {
    hostname: 'datos.madrid.es',
    //port: 443,
    path: '/egob/catalogo/212531-10515086-calidad-aire-tiempo-real.csv',
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Accept-Encoding': 'gzip, deflate',
      'User-Agent': 'Mozilla/5.0'
    }
  };

  const req = https.request(options, (res) => {
    res.on('data', (d) => {
      process.stdout.write(d);
    });

    if (res.statusCode > 300 && res.statusCode < 400 && res.headers.location) {
      // The location for some (most) redirects will only contain the path
      // not the hostname, detect this and add the host to the path.
      url = res.headers.location
      options.path = url.split('.es')[1].replace(' ', '');
      options.hostname = url.split('/')[2]

      http.get(options, (res) => {
        let csv = ""
        res.on('data', (d) => {
          csv += String(d)
        });
        res.on('end', function() {
          // Processing csv data
          rows = csv.split('\n')
          processData(rows, station)
        });

      }).on('error', (e) => {
        console.error(e);
      });

    } else {
      let data = '';

      res.on('data', function(chunk) {
        data += chunk;
      }).on('end', function() {});
    }

  });

  req.on('error', (e) => {
    console.error(e);
  });
  req.end();
}

exports.particles = particles;

const zones = {
  '8': 'Escuelas Aguirre',
  '4': 'Plaza de España',
  '11': 'Avda. Ramón y Cajal',
  '16': 'Arturo Soria',
  '17': 'Villaverde',
  '18': 'Farolillo',
  '24': 'Casa de Campo',
  '27': 'Barajas Pueblo',
  '35': 'Pza. del Carmen',
  '36': 'Moratalaz',
  '38': 'Cuatro Caminos',
  '39': 'Barrio del Pilar',
  '40': 'Vallecas',
  '47': 'Mendez Alvaro',
  '48': 'Castellana',
  '49': 'Parque del Retiro',
  '50': 'Plaza Castilla',
  '54': 'Ensanche de Vallecas',
  '55': 'Urb. Embajada',
  '56': 'Pza. Fernández Ladreda',
  '57': 'Sanchinarro',
  '58': 'El Pardo',
  '59': 'Juan Carlos I',
  '60': 'Tres Olivos'
}

console.log(`${Object.keys(zones).length} zones`)
// (25 tablas)

for(z of Object.keys(zones).splice(0,3)){
  particles(z)
}