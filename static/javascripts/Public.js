
const websocketHeartbeatJsOptions = {
	url: "ws://"+ window.location.host +"/ws",
	pingTimeout: 15000,
	pongTimeout: 10000,
	reconnectTimeout: 2000,
	pingMsg: "heartbeat"
}

let websocketHeartbeatJs = new WebsocketHeartbeatJs(websocketHeartbeatJsOptions);

let ws = websocketHeartbeatJs;
// let ws = new WebSocket("ws://"+ window.location.host +"/ws");

function _time(time = +new Date()) {
	var date = new Date(time + 8 * 3600 * 1000); // 增加8小时
	return date.toJSON().substr(0, 19).replace('T', ' ');
	//return date.toJSON().substr(0, 19).replace('T', ' ').replace(/-/g, '/');
}

function WebSocketConnect(uid,username) {
	if ("WebSocket" in window) {
		console.log("您的浏览器支持 WebSocket!");
		// 打开一个 web socket
		// let ws = new WebSocket("ws://127.0.0.1:8322/ws");

		let send_data = JSON.stringify({
			"status": 1,
			"data": {
				"uid": uid,
				"username": username,
			}
		})

		ws.onopen = function () {
			ws.send(send_data);
			console.log("发送数据", send_data)
		};

		let chat_info = $('.main .chat_info')

		ws.onmessage = function (evt) {
			var received_msg = JSON.parse(evt.data);

			// let myDate = new Date();
			// let time = myDate.toLocaleDateString() + myDate.toLocaleTimeString()
			let time = _time(received_msg.data.time)

			switch(received_msg.status)
			{
				case 1:
					chat_info.html(chat_info.html() +
						'<li class="systeminfo"> <span>' +
						"【" +
						received_msg.data.username +
						"】" +
						time +
						" 加入了房间" +
						'</span></li>');
					break;
				case 2:
					chat_info.html(chat_info.html() +
						'<li class="systeminfo"> <span>' +
						"【" +
						received_msg.data.username +
						"】" +
						time +
						" 离开了房间" +
						'</span></li>');
					break;
				case 3:
					if ( received_msg.data.uid != uid )
					{
						chat_info.html(chat_info.html() +
							'<li class="left"><img src="/static/images/user/' +
							received_msg.data.avatar_id +
							'.png" alt=""><b>' +
							received_msg.data.username +
							'</b><i>' +
							time +
							'</i><div class="aaa">' +
							received_msg.data.content +
							'</div></li>');
					}
					break;
				case -1:
					ws.close() // 主动close掉
					console.log("client 连接已关闭...");
					break;
				default:
			}
			console.log("数据已接收...", received_msg);
		};

		ws.onclose = function () {
			// 关闭 websocket
			chat_info.html(chat_info.html() +
				'<li class="systeminfo"> <span>' +
				"与服务器连接断开，请刷新页面重试" +
				'</span></li>');
			// let c = ws.close() // 主动close掉
			console.log("serve 连接已关闭... " + _time());
			// console.log(c);
		};
	} else {
		// 浏览器不支持 WebSocket
		alert("您的浏览器不支持 WebSocket!");
	}
}

$(document).ready(function(){

	// -------------------------登录页面---------------------------------------------------

	// 登录按钮

	$('#login').click(function (event) {

		let userName = $('.login input[type=text]').val(); // 用户昵称
		let pwd = $('.login input[type=password]').val(); // 用户昵称

		let avatar_id = $('.user_portrait img').attr('portrait_id'); // 用户头像id

		$.post("/login", {
			username: userName,
			password: pwd,
			avatar_id: avatar_id
		}, function (res) {
			if (res.code != 0) {
				alert(res.msg);
				return false;
			}
			window.location.assign("/room");
			//window.location.href = '/room'; // 页面跳转
		});
	});

// ------------------------选择聊天室页面-----------------------------------------------

	// 用户信息提交

	$('#userinfo_sub').click(function(event) {
		var userName = $('.rooms .user_name input').val(); // 用户昵称
		var userPortrait = $('.rooms .user_portrait img').attr('portrait_id'); // 用户头像id
		if(userName=='') { // 如果不填用户昵称，就是以前的昵称
			userName = $('.rooms .user_name input').attr('placeholder');
		}


		// 下面是测试用的代码


		$('.userinfo a b').text(userName); // 修改标题栏的用户昵称
		$('.rooms .user_name input').val(''); // 昵称输入框清空
		$('.rooms .user_name input').attr('placeholder', userName); // 昵称输入框默认显示用户昵称
		$('.topnavlist .popover').not($(this).next('.popover')).removeClass('show'); // 关掉用户面板
		$('.clapboard').addClass('hidden'); // 关掉模糊背景
	});

	// 设置主题


	$('.theme img').click(function(event) {
		var theme_id = $(this).attr('theme_id');
		$('.clapboard').click(); // 关掉用户模糊背景




		// 下面是测试用的代码


		$('body').css('background-image', 'url(images/theme/' + theme_id + '_bg.jpg)'); // 设置背景
	});






















// --------------------聊天室内页面----------------------------------------------------

	// 发送图片

	$('.imgFileBtn').change(function(event) {

		var formData = new FormData();
		formData.append('file', $(this)[0].files[0]);
		$.ajax({
			url: '/img-kr-upload',
			type: 'POST',
			cache: false,
			data: formData,
			processData: false,
			contentType: false
		}).done(function(res) {
			console.log(res)

			var str = '<img src="' + res.data.url +'" />'

			sends_message($('.room').attr('data-username'), $('.room').attr('data-avatar_id'), str); // sends_message(昵称,头像id,聊天内容);

			let send_data = JSON.stringify({
				"status": 3,
				"data": {
					"uid": parseInt($('.room').attr('data-uid')),
					"username": $('.room').attr('data-username'),
					"avatar_id": $('.room').attr('data-avatar_id'),
					"image_url": res.data.url,
					"content": str
				}
			})

			console.log("send_data",send_data)
			ws.send(send_data);


			// 滚动条滚到最下面
			$('.scrollbar-macosx.scroll-content.scroll-scrolly_visible').animate({
				scrollTop: $('.scrollbar-macosx.scroll-content.scroll-scrolly_visible').prop('scrollHeight')
			}, 500);

			// 解决input上传文件选择同一文件change事件不生效
			event.target.value=''
		}).fail(function(res) {});



	});

	// 发送消息
	
	$('.text input').focus();
	$('#subxx').click(function(event) {
		var str = $('.text input').val(); // 获取聊天内容
		str = str.replace(/\</g,'&lt;');
		str = str.replace(/\>/g,'&gt;');
		str = str.replace(/\n/g,'<br/>');
		str = str.replace(/\[em_([0-9]*)\]/g,'<img src="images/face/$1.gif" alt="" />');
		if(str!='') {


			sends_message($('.room').attr('data-username'), $('.room').attr('data-avatar_id'), str); // sends_message(昵称,头像id,聊天内容);

			let send_data = JSON.stringify({
				"status": 3,
				"data": {
					"uid": parseInt($('.room').attr('data-uid')),
					"username": $('.room').attr('data-username'),
					"avatar_id": $('.room').attr('data-avatar_id'),
					"content": str
				}
			})

			ws.send(send_data);

			// console.log("send",send_data);


			// 滚动条滚到最下面
			$('.scrollbar-macosx.scroll-content.scroll-scrolly_visible').animate({
				scrollTop: $('.scrollbar-macosx.scroll-content.scroll-scrolly_visible').prop('scrollHeight')
			}, 500);

		}
		$('.text input').val(''); // 清空输入框
		$('.text input').focus(); // 输入框获取焦点
	});





























// -----下边的代码不用管---------------------------------------



	jQuery('.scrollbar-macosx').scrollbar();
	$('.topnavlist li a').click(function(event) {
		$('.topnavlist .popover').not($(this).next('.popover')).removeClass('show');
		$(this).next('.popover').toggleClass('show');
		if($(this).next('.popover').attr('class')!='popover fade bottom in') {
			$('.clapboard').removeClass('hidden');
		}else{
			$('.clapboard').click();
		}
	});
	$('.clapboard').click(function(event) {
		$('.topnavlist .popover').removeClass('show');
		$(this).addClass('hidden');
		$('.user_portrait img').attr('portrait_id', $('.user_portrait img').attr('ptimg'));
		$('.user_portrait img').attr('src', '/static/images/user/' + $('.user_portrait img').attr('ptimg') + '.png');
		$('.select_portrait img').removeClass('t');
		$('.select_portrait img').eq($('.user_portrait img').attr('ptimg')-1).addClass('t');
		$('.rooms .user_name input').val('');
	});
	$('.select_portrait img').hover(function() {
		var portrait_id = $(this).attr('portrait_id');
		$('.user_portrait img').attr('src', '/static/images/user/' + portrait_id + '.png');
	}, function() {
		var t_id = $('.user_portrait img').attr('portrait_id');
		$('.user_portrait img').attr('src', '/static/images/user/' + t_id + '.png');
	});
	$('.select_portrait img').click(function(event) {
		var portrait_id = $(this).attr('portrait_id');
		$('.user_portrait img').attr('portrait_id', portrait_id);
		$('.select_portrait img').removeClass('t');
		$(this).addClass('t');
	});
	$('.face_btn,.faces').hover(function() {
		$('.faces').addClass('show');
	}, function() {
		$('.faces').removeClass('show');
	});
	$('.faces img').click(function(event) {
		if($(this).attr('alt')!='') {
			$('.text input').val($('.text input').val() + '[em_' + $(this).attr('alt') + ']');
		}
		$('.faces').removeClass('show');
		$('.text input').focus();
	});
	$('.imgFileico').click(function(event) {
		$('.imgFileBtn').click();
	});
	function sends_message (userName, userPortrait, message) {
		if(message!='') {

			let myDate = new Date();
			let time = myDate.toLocaleDateString() + myDate.toLocaleTimeString()
			$('.main .chat_info').html($('.main .chat_info').html() + '<li class="right"><img src="/static/images/user/' + userPortrait + '.png" alt=""><b>' + userName + '</b><i>'+ time +'</i><div class="aaa">' + message  +'</div></li>');
		}
	}
	$('.text input').keypress(function(e) { 
		if (e.which == 13){
			$('#subxx').click();
		}
	});
});
