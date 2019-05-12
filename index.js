const PORT = 3484;									//Đặt địa chỉ Port được mở ra để tạo ra chương trình mạng Socket Server

var http = require('http');
var express = require('express');							//#include thư viện express - dùng để tạo server http nhanh hơn thư viện http cũ
var socketio = require('socket.io')				//#include thư viện socketio

var ip = require('ip');
var app = express();									//#Khởi tạo một chương trình mạng (app)
var server = http.Server(app)

var io = socketio(server);								//#Phải khởi tạo io sau khi tạo app

var webapp_nsp = io.of('/webapp')				//namespace của webapp
var esp8266_nsp = io.of('/esp8266')				//namespace của esp8266

var bodyParser     = require('body-parser');
var middleware = require('socketio-wildcard')();		//Để có thể bắt toàn bộ lệnh!
var mongoose = require('mongoose');

server.listen(process.env.PORT || PORT);

console.log("Server nodejs chay tai dia chi: " + ip.address() + ":" + PORT)


//###########################################################################################################
//Cài đặt webapp các fie dữ liệu tĩnh
app.use(express.static("node_modules/mobile-angular-ui")) 			// Có thể truy cập các file trong node_modules/mobile-angular-ui từ xa
app.use(express.static("node_modules/angular")) 							// Có thể truy cập các file trong node_modules/angular từ xa
app.use(express.static("node_modules/angular-route")) 				// Có thể truy cập các file trong node_modules/angular-route từ xa
app.use(express.static("node_modules/socket.io-client")) 				// Có thể truy cập các file trong node_modules/socket.io-client từ xa
app.use(express.static("node_modules/angular-socket-io"))			// Có thể truy cập các file trong node_modules/angular-socket-io từ xa
app.use(express.static("node_modules")) 
app.use(express.static("views")) 													// Dùng để lưu trữ webapp
app.use(bodyParser.urlencoded({ extended: true }));

app.use(bodyParser.json());

esp8266_nsp.use(middleware);									//Khi esp8266 emit bất kỳ lệnh gì lên thì sẽ bị bắt
webapp_nsp.use(middleware);									//Khi webapp emit bất kỳ lệnh gì lên thì sẽ bị bắt

app.use(function (req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	next();
});

//######################################--DATABASE--#####################################################################
mongoose.Promise = global.Promise;
var mongoURL = 'mongodb+srv://root:Password0@cluster0-bwm3m.mongodb.net/retryWrites=true';
mongoose.connect(mongoURL, { useNewUrlParser: true } );
var Device = require('./models/deviceModel');
var DeviceHistory = require('./models/deviceHistoryModel');



//###########################################################################################################


//##################################--DATABASE--#########################################################################

var routes = require('./routes/deviceRoute'); //importing route
routes(app); //register the route

//###########################################################################################################

function ParseJson(jsondata) {
    try {
        return JSON.parse(jsondata);
    } catch (error) {
        return null;
    }
}


//############################--SOCKET--###############################################################################
//Bắt các sự kiện khi esp8266 kết nối
esp8266_nsp.on('connection', function(socket) {
	console.log('esp8266 connected')
	
	socket.on('disconnect', function() {
		console.log("Disconnect socket esp8266")
	})
	
	//nhận được bất cứ lệnh nào
	socket.on("*", function(packet) {
		console.log("esp8266 rev and send to webapp packet: ", packet.data) //in ra để debug
		var eventName = packet.data[0]
		var eventJson = packet.data[1] || {} //nếu gửi thêm json thì lấy json từ lệnh gửi, không thì gửi chuỗi json rỗng, {}
		webapp_nsp.emit(eventName, eventJson) //gửi toàn bộ lệnh + json đến webapp
	})
})

//Bắt các sự kiện khi webapp kết nối

webapp_nsp.on('connection', function(socket) {
	
	console.log('webapp connected')
	
	//Khi webapp socket bị mất kết nối
	socket.on('disconnect', function() {
		console.log("Disconnect socket webapp")
	})
	
	socket.on('*', function(packet) {
		console.log("webapp rev and send to esp8266 packet: ", packet.data) //in ra để debug
		var eventName = packet.data[0]
		var eventJson = packet.data[1] || {} //nếu gửi thêm json thì lấy json từ lệnh gửi, không thì gửi chuỗi json rỗng, {}
		esp8266_nsp.emit(eventName, eventJson) //gửi toàn bộ lệnh + json đến esp8266
	});
})
//###########################################################################################################


//##################################--API--#########################################################################

app.get('/api', (req, res) => {
	var json = {
		"b": "{1,1}"
	}
	console.log("send LED ", json['b'])
	//io.emit("LED", json)
  	return res.send(json);
});

app.post('/api', (req, res) => {
  return res.send('Received a POST HTTP method');
});

app.put('/api', (req, res) => {
 var param = req.body;
 var data = {"name": "Led " + (2  - param[0])};
 Device.find(data, function(err, devices) {
      if (err){
        res.send(err);
      }
      if(devices.length){
      	if(param[0] == 0){
      		controlLed([param[1], devices[0].value]);
      	}else{
      		controlLed(devices[0].value, [param[1]]);
      	}
      	
      }
      res.json(devices);
  });
});

app.delete('/api', (req, res) => {
  console.log("DELETE: " +  req.query[0]);
  return res.send('Received a DELETE HTTP method');
});

var controlLed = function(data){
	console.lod("Led state: " + data)
  io.emit("LED", {"b" : data});
}



//###########################################################################################################
