// ==UserScript==
// @name           KG_JSParser_only_xpress
// @version        1.0.6
// @namespace      klavogonki
// @author         NIN, kazimur
// @description    Скрипт-парсер для Клавогонок
// @include        http*://klavogonki.ru/jsparser*
// @grant          none
// ==/UserScript==

(function() {

let kgjs_pers_messages = {};
let kgjs_inter_results = [];
let kgjs_total_results = [];
let kgjs_banned_ids = [];
let parse_zip = false;

if (!(location.href.match(/^https?:\/\/klavogonki\.ru\/jsparser.*$/))) return;
console.log("load jsparser_only");

document.title = document.title.replace("Ошибка", "JSParser");

const default_rules = (function() {
	let rule_avg_speed = {};
	rule_avg_speed.command = "avg_speed";
	rule_avg_speed.chat = false;
	rule_avg_speed.columns = (table) => {
		for (let _id of Object.keys(table)) {
			table[_id]["points"] = table[_id]["avg_speed"];
		}
		let columns=[];
		columns.push({"title":"№","data": (x) => x["sort_position"]});
		columns.push({"title":"Ник","data": (x) => table.list_get_last_not_none(x["name"]),"add_class":"kgjs-left-align"});
		columns.push({"title":"Результат","data": (x) => x["points"].toFixed(2)})
		for (const f of table.valid_game_numbers) {
			columns.push({"title":f.n.toString()+"\n"+f.gametype.title,"data": (x,_i=f.i) => x["speed"][_i],"game":f.i});
		}
		return columns;
	};

	let rule_avg_errors = {};
	rule_avg_errors.command = "avg_error_percent";
	rule_avg_errors.chat = false;
	rule_avg_errors.sort_func = (x) => -x[1]["avg_error_percent"];
	rule_avg_errors.columns = (table) => {
		for (let _id of Object.keys(table)) {
			table[_id]["points"] = table[_id]["avg_error_percent"];
		}
		let columns=[];
		columns.push({"title":"№","data": (x) => x["sort_position"]});
		columns.push({"title":"Ник","data": (x) => table.list_get_last_not_none(x["name"]),"add_class":"kgjs-left-align"});
		columns.push({"title":"Результат","data": (x) => x["points"].toFixed(2)})
		for (const f of table.valid_game_numbers) {
			columns.push({"title":f.n.toString()+"\n"+f.gametype.title,"data": (x,_i=f.i) => x["error_percent"][_i],"game":f.i});
		}
		return columns;
	};

	// Xpress

	function points_for_place(place) {
		points = {};
		points[1] = 60;
		points[2] = 54;
		points[3] = 48;
		points[4] = 43;
		points[5] = 40;
		points[6] = 38;
		points[7] = 36;
		points[8] = 34;
		points[9] = 32;
		points[10] = 31;
		points[11] = 30;
		points[12] = 29;
		points[13] = 28;
		points[14] = 27;
		points[15] = 26;
		points[16] = 25;
		points[17] = 24;
		points[18] = 23;
		points[19] = 22;
		points[20] = 21;
		points[21] = 20;
		points[22] = 19;
		points[23] = 18;
		points[24] = 17;
		points[25] = 16;
		points[26] = 15;
		points[27] = 14;
		points[28] = 13;
		points[29] = 12;
		points[30] = 11;
		points[31] = 10;
		points[32] = 9;
		points[33] = 8;
		points[34] = 7;
		points[35] = 6;
		points[36] = 5;
		points[37] = 4;
		points[38] = 3;
		points[39] = 2;
		points[40] = 1;
		place = parseInt(place);
		if ((place<=40) && (place>0))
			return points[place];
		else
			return 0;
	}

	function rewards_for_place(place) {
		let rewards = {};
		rewards[1] = 2500;
		rewards[2] = 2000;
		rewards[3] = 1500;
		rewards[4] = 1000;
		rewards[5] = 800;
		rewards[6] = 600;
		place = parseInt(place);
		if ((place<=6) && (place>0))
			return rewards[place];
		else
			return 0;
	}

	let rule_xpress1 = {};
	rule_xpress1.command = "xpress1";
	rule_xpress1.chat = false;
	rule_xpress1.columns = (table) => {
		let games_short = [];
		let games_usual = [];
		for (const f of table.valid_game_numbers) {
			if (f.gametype.class == "voc-14878")
				games_short.push(f);
			if (f.gametype.class == "voc-5539")
				games_usual.push(f);
		}

		for (let _i of table.items(table)) {
			let _id = _i[0];
			let _value = _i[1];
			let sum_points = 0;

			let speed = [];
			for (let gg of games_short.concat(games_usual)) {
				let g = gg.i;
				let _place = table[_id]["place"][g];
				sum_points += points_for_place(_place);
			}
			table[_id]["points"] = sum_points;

			sum_points = 0;
			speed = games_short.map(x => x.i).map(x => table[_id]["speed"][x]);
			let avg_speed = table.calc_avg_of_array(speed, 0);
			table[_id]["avg_speed_short"] = avg_speed;
			sum_points = games_short.map(x => x.i).map(x => points_for_place(table[_id]["place"][x])).reduce((a, b) => a + b, 0);
			table[_id]["points_short"] = sum_points;


			sum_points = 0;
			speed = games_usual.map(x => x.i).map(x => table[_id]["speed"][x]);
			avg_speed = table.calc_avg_of_array(speed, 0);
			table[_id]["avg_speed_usual"] = avg_speed;

			sum_points = games_usual.map(x => x.i).map(x => points_for_place(table[_id]["place"][x])).reduce((a, b) => a + b, 0);
			table[_id]["points_usual"] = sum_points;

			if (table[_id]["points"] == 0)
				delete table[_id];
		}


		let custom_header = "";
		custom_header += '<thead><tr><th colspan="7" class="bg-title">Stage 1: sprint</th></tr></thead>';
		custom_header += '<colgroup><col><col><col><col><col><col><col></colgroup>';
		let h = ["Место","Ник","Сумма очков","Очки Short texts in English","Ср. ск. Short texts in English","Очки Обычный in English","Ср. ск. Обычный in English"];
		custom_header += "<tr>";
		for (let _h of h)
			custom_header += '<th class="bg-title">'+_h+"</th>";
		custom_header+="</tr>";

		let columns=[];
		columns.push({"title":"custom","data": (x) => x["sort_position"],"header":custom_header});
		columns.push({"title":"Ник","data": (x) => table.list_get_last_not_none(x["name"]),"add_class":"kgjs-nick"});
		columns.push({"title":"Сумма очков","data": (x) => x["points"].toFixed(0)})
		columns.push({"title":"очки Short texts in English","data": (x) => x["points_short"].toFixed(0)})
		columns.push({"title":"ср.ск Short texts in English","data": (x) => x["avg_speed_short"].toFixed(2)})
		columns.push({"title":"очки Обычный in English","data": (x) => x["points_usual"].toFixed(0)})
		columns.push({"title":"ср.ск Обычный in English","data": (x) => x["avg_speed_usual"].toFixed(2)})
		return columns;
	};


	let minis_limit = 3;

	let rule_xpress2 = {};
	rule_xpress2.command = "xpress2";
	rule_xpress2.chat = false;

	rule_xpress2.columns = (table) => {
		let games_minis = [];
		for (const f of table.valid_game_numbers) {
			if (f.gametype.class == "voc-8835")
				games_minis.push(f);
		}

		for (let _i of table.items(table)) {
			let _id = _i[0];
			let _value = _i[1];

			let speed = games_minis.map(x => x.i).map(x => table[_id]["speed"][x]);
			let avg_speed = table.calc_avg_of_array(speed, 0);
			let finishes = table.calc_finishes_of_array(speed);
			table[_id]["avg_speed_minis"] = avg_speed;
			table[_id]["points"] = avg_speed;

			if (finishes < minis_limit)
				delete table[_id];
		}


		let custom_header = "";
		custom_header += '<thead><tr><th colspan="' + (3+games_minis.length) + '" class="bg-title">Stage 2: speed</th></tr></thead>';
		custom_header += '<colgroup>'+'<col>'.repeat(3+games_minis.length)+'</colgroup>';
		let h = ["Место","Ник","Средняя скорость"];
		h = h.concat(games_minis.map((el,idx) => "#"+(idx+1).toString()));
		custom_header += "<tr>";
		for (let _h of h)
			custom_header += '<th class="bg-title">'+_h+"</th>";
		custom_header+="</tr>";

		let columns=[];
		columns.push({"title":"custom","data": (x) => x["sort_position"],"header":custom_header});
		columns.push({"title":"Ник","data": (x) => table.list_get_last_not_none(x["name"]),"add_class":"kgjs-nick"});
		columns.push({"title":"Средняя","data": (x) => x["avg_speed_minis"].toFixed(2)})
		for (const g of games_minis) {
			columns.push({"data": (x,_i=g.i) => x["speed"][_i],"game":g.i});
		}
		return columns;
	};

	let rule_xpress3 = {};
	rule_xpress3.command = "xpress3";
	rule_xpress3.chat = false;
	rule_xpress3.sort_func = (x) => -x[1]["avg_error_percent"];

	rule_xpress3.columns = (table) => {
		let games_minis = [];
		for (const f of table.valid_game_numbers) {
			if (f.gametype.class == "voc-8835")
				games_minis.push(f);
		}

		for (let _i of table.items(table)) {
			let _id = _i[0];
			let _value = _i[1];

			let v_error_percent = games_minis.map(x => x.i).map(x => table[_id]["error_percent"][x]);
			let finishes = table.calc_finishes_of_array(v_error_percent);
			let avg_error_percent = table.calc_avg_of_array(v_error_percent, Infinity);
			table[_id]["avg_error_percent"] = avg_error_percent;
			table[_id]["points"] = avg_error_percent;
			if (finishes < minis_limit)
				delete table[_id];
		}

		let custom_header = "";
		custom_header += '<thead><tr><th colspan="' + (3+games_minis.length) + '" class="bg-title">Stage 2: accuracy</th></tr></thead>';
		custom_header += '<colgroup>'+'<col>'.repeat(3+games_minis.length)+'</colgroup>';
		let h = ["Место","Ник","Средний процент ошибок"];
		h = h.concat(games_minis.map((el,idx) => "#"+(idx+1).toString()));
		custom_header += "<tr>";
		for (let _h of h)
			custom_header += '<th class="bg-title">'+_h+"</th>";
		custom_header+="</tr>";

		let columns=[];
		columns.push({"title":"custom","data": (x) => x["sort_position"],"header":custom_header});
		columns.push({"title":"Ник","data": (x) => table.list_get_last_not_none(x["name"]),"add_class":"kgjs-nick"});
		columns.push({"title":"Средний","data": (x) => x["avg_error_percent"].toFixed(2)})
		for (const g of games_minis) {
			columns.push({"data": (x,_i=g.i) => x["error_percent"][_i],"game":g.i});
		}
		return columns;
	};

	let rule_xpress = {};
	rule_xpress.command = "xpress";
	rule_xpress.chat = false;
	rule_xpress.columns = (table) => {
		if (!$("kgjs_custom_block_xpress")) {
			let el = document.createElement('div');
			el.setAttribute('id', 'kgjs_custom_block_xpress');
			el.innerHTML = ''+
			  '<div><table id="kgjs_xpress_table1"></table></div>'+
			  '<div><table id="kgjs_xpress_table2"></table></div>'+
			  '<div><table id="kgjs_xpress_table3"></table></div>'+
			  '<div>'+
			    '<button id="kgjs_xpress_cache">Drop rank cache</button>'+
			    '<button id="kgjs_xpress_image1">Gen image 1</button>'+
			    '<button id="kgjs_xpress_image2">Gen image 2</button>'+
			    '<button id="kgjs_xpress_image3">Gen image 3</button>'+
			  '</div>'+
			  '<div><textarea id="kgjs_xpress_rewards"></textarea></div>'+
			  '<div>'+
			    '<label>For AutoRaceCreator</label><br>'+
			    '<input type="text" placeholder="Ссылка на тему события" value="[English Xpress 00 (000)]()" pattern="\\[English Xpress \\d\\d+ \\(\\d\\d\\d+\\)\\]\\(http.*\\)" id="kgjs_xpress_forum_url">'+
			  '</div>'+
			  '<div><table id="kgjs_xpress_table4"></table></div>'+
			'';

			el.className = "xpress";
			$("kgjs_custom_block").append(el);
			document.getElementById("kgjs_xpress_cache").onclick = function(){cache_ranks={};localStorage.xpressranks_only = "";};
			document.getElementById("kgjs_xpress_image1").onclick = function(){table.gen_image(document.getElementById('kgjs_xpress_table1'));};
			document.getElementById("kgjs_xpress_image2").onclick = function(){table.gen_image(document.getElementById('kgjs_xpress_table2'));};
			document.getElementById("kgjs_xpress_image3").onclick = function(){table.gen_image(document.getElementById('kgjs_xpress_table3'));};
		}

		loadRanks(table);

		table.items(table).forEach((x) => table[x[0]]["rewards_sprint"]=0);
		table.items(table).forEach((x) => table[x[0]]["rewards_speed"]=0);
		table.items(table).forEach((x) => table[x[0]]["rewards_accuracy"]=0);
		table.items(table).forEach((x) => table[x[0]]["rewards_total"]=0);

		let sort_func = (x) => x[1]["points"]+(x[1]["avg_speed_short"] || 0 + x[1]["avg_speed_usual"] || 0)/5000;
		let orig_table = {};
		Object.assign(orig_table, table);
		let html1 = table.render_default_table_view(table, sort_func, rule_xpress1.columns(table));
		$("kgjs_xpress_table1").innerHTML = html1;
		$("kgjs_xpress_table1").className = "xpress";

		let sorted_ids = table.items(table).sort((a,b) => -sort_func(a) + sort_func(b));
		sorted_ids = sorted_ids.slice(0, Math.min(6, sorted_ids.length));

		function color_for_rang_fg(r) {
			let colors = {};
			colors[0] = "#000000";
			colors[1] = "#8d8d8d";
			colors[2] = "#4f9a97";
			colors[3] = "#187818";
			colors[4] = "#8c8100";
			colors[5] = "#ba5800";
			colors[6] = "#bc0143";
			colors[7] = "#5e0b9e";
			colors[8] = "#00037c";
			colors[9] = "#061956";
			return colors[r].toUpperCase();
		}

		function fancyNick(x) {
			let out = "[url=https://klavogonki.ru/profile/{id}/stats/][color={color}][b][u]{nick}[/u][/b][/color][/url]";
			out = out.replace("{id}", table.list_get_last_not_none(x["id"]));
			out = out.replace("{color}", color_for_rang_fg(table.list_get_last_not_none(x["rank"])));
			out = out.replace("{nick}", table.list_get_last_not_none(x["name"]));
			return out;
		}

		function rewardsText(x) {
			let rewards = {};
			rewards[1] = 2500;
			rewards[2] = 2000;
			rewards[3] = 1500;
			rewards[4] = 1000;
			rewards[5] = 800;
			rewards[6] = 600;

			let place = x["sort_position"];
			let out = "";
			if (place==1)
				out += "[img]https://klavogonki.ru/img/smilies/first.gif[/img] 1st place:";
			else if (place==2)
				out += "[img]https://klavogonki.ru/img/smilies/second.gif[/img] 2nd place:";
			else if (place==3)
				out += "[img]https://klavogonki.ru/img/smilies/third.gif[/img] 3rd place:";
			else
				out += place.toString() + "th place:";
			out += " " + fancyNick(x);
			out += " – " + rewards[place] + " points";
			out += "\n";
			return out;
		}

		table.items(table).forEach((x) => table[x[0]]["rewards_sprint"]=rewards_for_place(table[x[0]]["sort_position"]));
		table.items(table).forEach((x) => table[x[0]]["position_sprint"]=table[x[0]]["sort_position"]);

		let chat_format = {"title":"", "data": (x) => rewardsText(x)};
		let total_msgs = table.gen_default_total(table, sorted_ids, chat_format);
		let text_sprint = total_msgs.join();

		table = {};
		Object.assign(table, orig_table);
		let html2 = table.render_default_table_view(table, sort_func, rule_xpress2.columns(table));
		$("kgjs_xpress_table2").innerHTML = html2;
		$("kgjs_xpress_table2").className = "xpress";

		table.items(table).forEach((x) => table[x[0]]["rewards_speed"]=rewards_for_place(table[x[0]]["sort_position"]));
		table.items(table).forEach((x) => table[x[0]]["position_speed"]=table[x[0]]["sort_position"]);

		sorted_ids = table.items(table).sort((a,b) => -sort_func(a) + sort_func(b));
		sorted_ids = sorted_ids.slice(0, Math.min(6, sorted_ids.length));
		total_msgs = table.gen_default_total(table, sorted_ids, chat_format);
		let text_speed = total_msgs.join();

		table = {};
		Object.assign(table, orig_table);
		let html3 = table.render_default_table_view(table, rule_xpress3.sort_func, rule_xpress3.columns(table));
		$("kgjs_xpress_table3").innerHTML = html3;
		$("kgjs_xpress_table3").className = "xpress";

		table.items(table).forEach((x) => table[x[0]]["position_accuracy"]=table[x[0]]["sort_position"]);

		sort_func = rule_xpress3.sort_func;
		sorted_ids = table.items(table).sort((a,b) => -sort_func(a) + sort_func(b));
		let sorted_ids1 = sorted_ids.slice(0, 3);
		let sorted_ids2 = sorted_ids.slice(3);
		sorted_ids2 = sorted_ids2.filter((c) => table[c[0]]["avg_error_percent"]<1.001);
		sorted_ids2 = sorted_ids2.slice(0, 3);
		sorted_ids = sorted_ids1.concat(sorted_ids2);
		total_msgs = table.gen_default_total(table, sorted_ids, chat_format);
		let text_accuracy= total_msgs.join();
		sorted_ids.forEach((x) => table[x[0]]["rewards_accuracy"]=rewards_for_place(table[x[0]]["sort_position"]));

		$("kgjs_xpress_rewards").value = genForumRewards(text_sprint, text_speed, text_accuracy);

		function arc_msg(x) {
			let template =  "For participation in {forum_url}. Congratulations!";
			let out = template.replaceAll("{forum_url}", $("kgjs_xpress_forum_url").value);
			return out;
		}

		function journal_post(x) {

			let images_url = {};
			images_url["sprint"] = {};
			images_url["sprint"][1] = "https://live.staticflickr.com/65535/51280811378_33545400e7_o.png";
			images_url["sprint"][2] = "https://live.staticflickr.com/65535/51281363959_c8185fa096_o.png";
			images_url["sprint"][3] = "https://live.staticflickr.com/65535/51281654275_d1ef6c77bd_o.png";

			images_url["speed"] = {};
			images_url["speed"][1] = "https://live.staticflickr.com/65535/51279892582_857283463b_o.png";
			images_url["speed"][2] = "https://live.staticflickr.com/65535/51281654340_a7120284a3_o.png";
			images_url["speed"][3] = "https://live.staticflickr.com/65535/51279892562_1ea1f49554_o.png";

			images_url["accuracy"] = {};
			images_url["accuracy"][1] = "https://live.staticflickr.com/65535/51280636201_c8754130d3_o.png";
			images_url["accuracy"][2] = "https://live.staticflickr.com/65535/51279892612_d9986399c6_o.png";
			images_url["accuracy"][3] = "https://live.staticflickr.com/65535/51281363994_d69eb704e2_o.png";

			let out = "";
			let place = x["position_sprint"];
			let template =  "__{title}, {place} place, {forum_url}__\n\n![{title}, {place} place]({image_url})";
			template += '\n<img class="kgjs_xpress_rewards_image" src="{image_url}"></img>\n'
			let fill_template = (template,a,b,c) => template
			    .replaceAll("{title}",a)
			    .replaceAll("{place}",(b==1)?"1st":(b==2)?"2nd":"3rd")
			    .replaceAll("{forum_url}",$("kgjs_xpress_forum_url").value)
			    .replaceAll("{image_url}",c);
			if (place<=3) {
				out += fill_template(template, "Sprint", place, images_url["sprint"][place]);
			}
			place = x["position_speed"];
			if (place<=3) {
				out += fill_template(template, "Speed", place, images_url["speed"][place]);
			}
			place = x["position_accuracy"];
			if (place<=3) {
				out += fill_template(template, "Accuracy", place, images_url["accuracy"][place]);
			}
			out = out.replace(/\n+$/, "");
			out = out.replaceAll("\n","\n<br>");
			return out;
		}

		table = {};
		Object.assign(table, orig_table);
		table.items(table).forEach((x) => table[x[0]]["rewards_total"]=table[x[0]]["rewards_sprint"]+table[x[0]]["rewards_speed"]+table[x[0]]["rewards_accuracy"]);
		sort_func = (x) => x[1]["rewards_total"];

		let columns=[];
		columns.push({"title":"Ник","data": (x) => table.list_get_last_not_none(x["name"]), "add_class":"kgjs-nick kgjs-arcselect"});
		columns.push({"title":"Кол-во очков","data": (x) => x["rewards_total"],"add_class":"kgjs-arcselect"});
		columns.push({"title":"Сообщение к очкам","data": (x) => arc_msg(x),"add_class":"kgjs-arcselect"});
		columns.push({"title":"Запись в бортжурнале","data": (x) => journal_post(x), "add_class":"kgjs-journal-cell"});
		table.items(table).filter((x) => table[x[0]]["rewards_total"]<=0).forEach((x) => delete table[x[0]]);

		let html4 = table.render_default_table_view(table, sort_func, columns);

		html4 = '<tr><td colspan="3"><button id="xpress_copy_arc_button">copy</button></td>'+
		        '<td><button id="xpress_copy_arc_button2">copy</button><br><label><input type="checkbox" id="kgjs_arc_images_checkbox">Show images</label></td>'+
		        '</tr>' + html4;

		$("kgjs_xpress_table4").innerHTML = html4;
		$("kgjs_xpress_table4").className = "xpress";


		function writeClipboard(t) {
			const el = document.createElement('textarea');
			el.value = t;
			document.body.appendChild(el);
			el.select();
			document.execCommand('copy');
			document.body.removeChild(el);
		}

		function updateArcImages(show) {
			$$('.kgjs-journal-cell img').forEach((x) => x.style.display=(show)?'inline-block':'none');
		}
		$("kgjs_arc_images_checkbox").addEventListener('change',function() {
			updateArcImages(this.checked);
		});
		updateArcImages($("kgjs_arc_images_checkbox").checked);

		let b = $("xpress_copy_arc_button");
		if (!b.hasAttribute('kgjs_checked')) {
			b.setAttribute('kgjs_checked', 'value');
			b.addEventListener('click', function() {
				let cells = document.getElementsByClassName('kgjs-arcselect');
				let columns_clipboard = "";
				for (let i = 0; i < cells.length; i++) {
					if (i%3==2)
						columns_clipboard += cells[i].textContent+"\n";
					else
						columns_clipboard += cells[i].textContent+"\t";
				}
				writeClipboard(columns_clipboard);
			});
		}

		b = $("xpress_copy_arc_button2");
		if (!b.hasAttribute('kgjs_checked')) {
			b.setAttribute('kgjs_checked', 'value');
			b.addEventListener('click', function() {
				let cells = document.getElementsByClassName('kgjs-journal-cell');
				let columns_clipboard = "";
				for (let i = 0; i < cells.length; i++) {
					columns_clipboard += cells[i].textContent+"\n\n";
				}
				writeClipboard(columns_clipboard);
			});
		}

		return [];
	}

function genForumRewards(text1, text2, text3) {
	let out = "";
	out += "[b]Rewards[/b]\n";
	out += "\n";
	out += "[b]Stage 1: sprint[/b]\n";
	out += text1;
	out += "\n";
	out += "[b]Stage 2: speed[/b]\n";
	out += text2;
	out += "\n";
	out += "[b]Stage 2: accuracy[/b]\n";
	out += text3;
	out += "\n";
	return out;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

let cache_ranks = {};
try {
	cache_ranks = JSON.parse(localStorage.xpressranks_only);
}
catch {
}
let popup_url = location.protocol+"//klavogonki.ru/ajax/profile-popup?user_id={}&gametype=voc-5539";

function loadRanks(table) {
	table.items(table).forEach((x) => table[x[0]]["rank"]=[0]);
	for (let _i of table.items(table)) {
		let _id = _i[0];
		let _value = _i[1];
		let popup = cache_ranks[_id];
		let match = false;
		if (popup)
			match = popup.match(/Лучшая скорость\:([\s\S]*?)(\d+) зн\/мин\<\/td\>/);
		if (match) {
			let speed = match[2];
			let rank = Math.trunc(speed/100)+1;
			if (rank>9) rank=9;
			table[_id]["rank"] = [rank];
		}
	}
	getRanks(table);
}

async function getRanks(table) {
	for (let _i of table.items(table)) {
		let _id = _i[0];
		let _value = _i[1];
		if (!cache_ranks.hasOwnProperty(_id) || cache_ranks[_id]=="You are sending requests too fast!") {

			try {
				console.log("getting rank: "+_id);
				let response = await fetch(popup_url.replace("{}",_id));
				let data = await response.text();
				cache_ranks[_id] = data;
				sleep(1000);
			}
			catch (error) {
				console.log("error: "+error);
			}
		}
	}
	localStorage.xpressranks_only = JSON.stringify(cache_ranks);
}


let inject_css = document.createElement("style");
inject_css.setAttribute("type", "text/css");
inject_css.innerHTML = ''+
'#kgjs_main_block table[class^="xpress"],'+
'#kgjs_main_block table[class^="xpress"] * {'+
	'box-sizing: content-box;'+
	'border-collapse: collapse;'+
'}'+
'table[class^="xpress"] tbody,'+
'table[class^="xpress"] thead {'+
	'border-style: solid;'+
	'border-color: #000;'+
	'border-width: 3px;'+
'}'+
'#kgjs_main_block table[class^="xpress"] {'+
	'border-collapse: collapse;'+
	'font-size: 14px;'+
	'line-height: 150%;'+
	'max-width: 720px;'+
	'display: inline-block;'+
	'font-variant: normal;'+
	'overflow: auto;'+
	'font-family: Arial, Helvetica, sans-serif;'+
'}'+
'table[class^="xpress"] td, table[class^="xpress"] th {'+
	'padding: 2px;'+
	'border-style: solid;'+
	'border-color: #000;'+
	'border-width: 1px;'+
	'white-space: nowrap;'+
	'text-align: center;'+
'}'+
'table[class^="xpress"] td.bg-title, '+
'table[class^="xpress"] th.bg-title {'+
	'font-weight: bold;'+
	'min-width: 60px;'+
	'max-width: 120px;'+
	'white-space: normal;'+
	'hyphens: manual;'+
	'overflow-wrap: break-word;'+
	'background-color: #d9d9d9;'+
'}'+
'table[class^="xpress"] col {'+
	'border: 2px solid black;'+
'}'+
'table[class^="xpress"] thead {'+
	'font-size: 24px;'+
'}'+
'table[class^="xpress"] thead th {'+
	'padding: 10px;'+
'}'+
'table[class^="xpress"] .kgjs-nick {'+
	'font-weight:bold;'+
	'min-width: 100px;'+
	'padding-left: 10px;'+
	'padding-right: 10px;'+
	'text-align: left;'+
'}'+
'table[class^="xpress"] .kgjs-arcselect {'+
	'max-width: 250px;'+
	'overflow: auto;'+
'}'+
'table[class^="xpress"] .kgjs-journal-cell {'+
	'text-align: left;'+
	'max-width: 250px;'+
	'overflow: auto;'+
'}'+
'table[class^="xpress"] tr {background-color: #f2f2f2;}'+
'#kgjs_xpress_rewards {'+
	'width: 100%;'+
	'height: 100px;'+
'}'+

'#kgjs_custom_block_xpress > * {'+
	'margin-top: 5px;'+
'}'+
'#kgjs_custom_block[class^="xpress"] > div[class^="xpress"] {'+
	'display: inline-block;'+
'}'+
'img.kgjs_xpress_rewards_image {'+
	'width: 150px;'+
	'display: none;'+
'}'+
'#kgjs_xpress_forum_url {'+
	'width: 100%;'+
'}'+
'#kgjs_xpress_forum_url:invalid {'+
	'border: 2px solid red;'+
'}'+
'';
document.body.appendChild(inject_css);

// end Xpress

	return {"avg_speed": rule_avg_speed, "avg_error_percent": rule_avg_errors, "xpress": rule_xpress};
})();

let rules = default_rules;
let current_rule = Object.keys(rules)[0];

function copy_object(a) {
	return JSON.parse(JSON.stringify(a));
}

const defaultSettings = {
	selected_rule: undefined,
};
let settings = copy_object(defaultSettings);
{
	let data;
	try {
		data = JSON.parse(localStorage.jsparser_only);
	}
	catch {
		data = defaultSettings;
	}
	if (typeof(data)!=="object") {
		data = defaultSettings;
	}
	if (!data.hasOwnProperty("selected_rule")) {
		data.selected_rule = defaultSettings.selected_rule;
	}
	localStorage.jsparser_only = JSON.stringify(data);
	settings = copy_object(data);
}

function saveSettings() {
	localStorage.jsparser_only = JSON.stringify(settings);
}


function work() {

if (!s5_loaded) return;

function click_loadzip() {
	parse_zip = true;
}

function gen_image(input) {
	let el = input || document.getElementById('kgjs_calc_table');
	let gen_image_tmp = el.style.overflow;
	el.style.overflow = "visible";
	domtoimage.toBlob(el).then(function (blob) {
		const blobUrl = URL.createObjectURL(blob);
		window.open(blobUrl, '_blank');
		el.style.overflow = gen_image_tmp;
	});
}


window.jsparser = {};
window.jsparser.rules = {};
window.jsparser.update_rules = function(){
	rules = {};
	for (const r of Object.keys(default_rules)) {
		rules[r] = default_rules[r];
	}
	for (const r of Object.keys(window.jsparser.rules)) {
		rules[r] = window.jsparser.rules[r];
	}
	let radios_html = "";
	radios_html += '<form>';
	for (let o in rules) {
		radios_html += '<label><input name="kgjs_rules" type="radio" value="'+o+'">'+o+'</label>';
	}
	radios_html += "</form>";
	let radios_elem = document.getElementById('kgjs_radios_form');
	radios_elem.innerHTML = radios_html;
	document.getElementById("kgjs_radios_form").kgjs_rules.value = current_rule;
	if (settings.selected_rule) {
		let new_current_rule = settings.selected_rule;
		if (new_current_rule != current_rule) {
			document.getElementById("kgjs_radios_form").kgjs_rules.value = new_current_rule;
			setRules(new_current_rule);
			calc();
		}
	}

};


if (settings.selected_rule) {
	current_rule = settings.selected_rule;
}
else {
	settings.selected_rule = current_rule;
	saveSettings();
}

try {
	command = rules[current_rule]["command"];
}
catch {
	current_rule = Object.keys(rules)[0];
	command = rules[current_rule]["command"];
}

function setRules(r) {
	current_rule = r;
	try {
		command = rules[current_rule]["command"];
	}
	catch {
		current_rule = Object.keys(rules)[0];
		command = rules[current_rule]["command"];
	}
}

let mainelem = document.createElement('div');
mainelem.setAttribute('id', 'kgjs_main_block');
mainelem.innerHTML = ""+
'<div id="KGJS_tab_2">'+
'<label id="kgjs_parser_title">JSParser</label>'+
'<div><label for="kgjs_parser_loadzip">Load Files:</label><input id="kgjs_parser_loadzip" type="file" multiple></input></div>'+
'<div style="max-width:500px;"><label for="kgjs_radios_form">Rules:</label><form id="kgjs_radios_form"></form></div>'+
'<div>'+//<button id="kgjs_btn_hide_table">Hide/Show</button>
'<button id="kgjs_btn_calc">Calc</button>'+
'<button id="kgjs_btn_gen_image">Gen Image</button>'+
'<input type="text" placeholder="Banned IDs" value="" id="kgjs_xpress_banned_ids">'+
'</div>'+
''+
'<div>'+
'<table id="kgjs_calc_table"></table>'+
'</div>'+
'<div id="kgjs_custom_block"></div>'+
'</div>'+
''+
'</div>';

//$(document.body).insert(mainelem);
let p = jQuery("div.msg").parent();
jQuery("div.msg").remove();
p.append(mainelem);

window.jsparser.update_rules();

function clickEnabled() {
	settings.chat.enabled = !settings.chat.enabled;
	saveSettings();
}
function clickAutosend() {
	settings.chat.autosend = !settings.chat.autosend;
	saveSettings();
}
function calc_save() {
	let r = document.getElementById("kgjs_radios_form").kgjs_rules.value;
	settings.selected_rule = r;
	saveSettings();
	let ids = document.getElementById("kgjs_xpress_banned_ids").value;
	kgjs_banned_ids = ids.split(",").map((id) => id.trim());
	calc();
};

document.getElementById("kgjs_btn_calc").onclick = calc_save;
document.getElementById("kgjs_btn_gen_image").onclick = (x) => gen_image();
document.getElementById("kgjs_radios_form").kgjs_rules.value = current_rule;

let ziplist = [];
$("kgjs_parser_loadzip").on("change", function(evt) {
	async function handleFile(f) {
		let zip =  await JSZip.loadAsync(f);
		ziplist = [];
		let zlist = zip.file(/.*/);
		let ziplist_size = zlist.length;
		function sortfilename(a,b) {
			let res = (a>b);
			try {
				res = parseInt(a.name) - parseInt(b.name);
			}
			catch (e) {};
			return res;
		}
		let zlist_sorted = zlist.sort((a,b) => sortfilename(a,b));
		zlist = zlist_sorted;

		for (let zfile of zlist) {
			let data = await zip.file(zfile.name).async("string");
			ziplist.push({html:data});
		}
		parse_zip = true;
		input_values = ziplist;
		calc();
	}
	async function handleHTMLFiles(f) {
		//let zip =  await JSZip.loadAsync(f);
		ziplist = [];
		//let zlist = zip.file(/.*/);
		let zlist = f;
		let ziplist_size = zlist.length;
		function sortfilename(a,b) {
			let res = (a>b);
			try {
				res = parseInt(a.name) - parseInt(b.name);
			}
			catch (e) {};
			return res;
		}
		let zlist_sorted = zlist.sort((a,b) => sortfilename(a,b));
		zlist = zlist_sorted;

		for (let zfile of zlist) {
			//let data = await zip.file(zfile.name).async("string");
			let data = await zfile.text();
			ziplist.push({html:data});
		}
		parse_zip = true;
		input_values = ziplist;
		calc();
	}

	let files = evt.target.files;
	let ffiles = [];
	for (let i=0; i < files.length; i++) {
		ffiles.push(files[i]);
	}
	handleHTMLFiles(ffiles);
	/*
	for (let i=0; i < files.length; i++) {
		handleFile(files[i]);
	}
	*/
});

/*
document.getElementById("kgjs_btn_hide_table").onclick = function(){
	$("kgjs_calc_table").style.display = ($("kgjs_calc_table").style.display === "none")?"inline-block":"none";
	$("kgjs_custom_block").style.display = ($("kgjs_custom_block").style.display === "none")?"inline-block":"none";
};
$("kgjs_calc_table").style.display = "none";
$("kgjs_custom_block").style.display = "none";
*/
$("kgjs_calc_table").style.display = "inline-block";
$("kgjs_custom_block").style.display = "inline-block";

let inject_css = document.createElement("style");
inject_css.setAttribute("type", "text/css");
inject_css.innerHTML = ''+
'div#kgjs_main_block {'+
	//'left: 50%;'+
	//'top: 0px;'+
	//'z-index: 200;'+
	//'background-color: gray;'+
	//'position: absolute;'+
	//'transform: translateX(-50%);'+
	//'padding: 2px;'+
	'background: #f0f0f0;'+
	'border-radius: 15px;'+
	'box-shadow: 0 0 15px #f0f0f0;'+
	//'width: 450px;'+
	'padding: 20px;'+
	'text-align: left;'+
	'position: relative;'+
'}'+
'label#kgjs_parser_title {'+
	'font-size: 18px;'+
	'font-variant: normal;'+
	'font-family: Arial, Helvetica, sans-serif;'+
'}'+
'div#kgjs_main_block>div>div * {'+
	'margin-right: 5px;'+
'}'+
'div#kgjs_main_block>div>div>* {'+
	'margin-top: 5px;'+
'}'+

//'.KGJS_tabs { width: 100%; padding: 0px; margin: 0 auto; }'+
'#kgjs_radios_form {'+
	'display: inline-block;'+
'}'+

''+
'#kgjs_autosaves_table th {'+
	'padding-top: 12px;'+
	'padding-bottom: 12px;'+
	'text-align: center;'+
	'background-color: #4CAF50;'+
	'color: white;'+
'}'+
'#kgjs_parser_loadzip {'+
	'display: inline-block;'+
'}'+
'table#kgjs_calc_table {'+
	//'max-width: 800px;'+
	//'max-height: 800px;'+
	'display: inline-block;'+
	'font-variant: normal;'+
	'overflow: auto;'+
	'font-family: Arial, Helvetica, sans-serif;'+
	'border-collapse: collapse;'+
'}'+
''+
'#kgjs_calc_table td, #kgjs_calc_table th {'+
	'border-style: solid;'+
	'border-color: #000;'+
	'border-width: 1px;'+
	'padding: 4px;'+
	'white-space: nowrap;'+
	'text-align: center;'+
'}'+
'#kgjs_calc_table td.kgjs-left-align, #kgjs_calc_table th.kgjs-left-align {'+
	'text-align: left;'+
'}'+
'#kgjs_calc_table .bg-title {'+
	'white-space: normal;'+
	'hyphens: manual;'+
	'overflow-wrap: break-word;'+
	'max-width: 50px;'+
	'background-color: #d9d9d9;'+
'}'+
''+
'#kgjs_calc_table tr {background-color: #f2f2f2;}'+
'#kgjs_custom_block > div {'+
	//'max-width: 800px;'+
	//'max-height: 800px;'+
	//'overflow: auto;'+
'}'+
'#kgjs_custom_block > div {'+
    'display: none;'+
'}'+
''+
'td.rank-1 {background-color: #cccccc;}'+//?
'td.rank-2 {background-color: #cc9999;}'+//?
'td.rank-3 {background-color: #ccffcc;}'+
'td.rank-4 {background-color: #ffff99;}'+
'td.rank-5 {background-color: #ffcc99;}'+
'td.rank-6 {background-color: #ff99cc;}'+
'td.rank-7 {background-color: #cc99ff;}'+
'td.rank-8 {background-color: #99ccff;}'+
'td.rank-9 {background-color: #6699ff;}'+

'';
document.body.appendChild(inject_css);


/*
 * parser
 */

function is_player_string(s) {
	return (s.search(/onmouseout=\"hideProfilePopup/) > -1);
}

function split_player_strings(s) {
	return s.split("div class=\"player");
}

function parse_name(s) {
	let m = s.match(/onmouseout=\"hideProfilePopup\([0-9]*\);\".*?>(.*?)<\/a>/);
	if (m)
		return m[1];
	return null;
}

function parse_id(s) {
	let m = s.match(/onmouseout=\"hideProfilePopup\(([0-9]*)\);\".*?>/);
	if (m)
		return m[1];
	return null;
}

function parse_error_percent(s) {
	let m = s.match(/ошиб.. \(<span class=\"bitmore\"><span class=\"bitmore\">(.*?)<\/span><\/span>%\)/);
	if (m)
		return parseFloat(m[1].replace(',','.'));
	return null;
}

function parse_error_count(s) {
	let m = s.match("<span class=\"bitmore\">([0-9]*)</span></span> ошиб");
	if (m)
		return parseInt(m[1]);
	return null;
}

function parse_speed(s) {
	let m = s.match("<span class=\"bitmore\"><span class=\"bitmore\">([0-9]*)</span></span> <span id=\"(.*?)\">зн/мин</span>");
	if (m)
		return parseInt(m[1]);
	return null;
}

function parse_place(s) {
	let m = s.match(">([0-9]*) место</ins>");
	if (m)
		return parseInt(m[1]);
	return null;
}

function parse_rank(s) {
	let m = s.match("class=\"rang([0-9]*) ");
	if (m)
		return parseInt(m[1]);
	return null;
}

function parse_award_mileage(s) {
	let m = s.match("за ([0-9]*) текстов пробега\">");
	if (m)
		return parseInt(m[1]);
	return null;
}

function parse_time(s) {
	let m = s.match("<div class=\"stats\" id=\"stats[0-9]*\"><div><span class=\"bitmore\"><span class=\"bitmore\">([0-9]*):([0-9]*)</span></span>\.([0-9]*)</div>");
	if (m)
		return parseInt(m[1])*60 + parseFloat(m[2]+"."+m[3]);
	return null;
}

function is_gamedesc_string(s) {
	return (s.search(/id=\"gamedesc\"/) > -1);
}

function parse_gamedesc(s) {
	let m = s.match("<td id=\"gamedesc\"><span class=\"gametype-(.*?)\">(.*?)</span>");
	if (m) {
		let _class = m[1];
		let _title = m[2];
		_title = _title.replaceAll('-', '\u2011'); // fix breaking words on hyphens when generating image
		if (_class == "voc") {
			let m2 = _title.match("/vocs/(\\d*?)/");
			_class = "voc" + (m2? "-" + m2[1].toString() : "");
		}
		return {"class": _class, "title": _title};
	}
	return null
}

function Table() {
	this.num_games = 0;

	this.add_missing_games = function(_id, n) {
		for (let k of Object.keys(this[_id])) {
			this[_id][k] = this[_id][k].concat(new Array(n).fill(null));
		}
	}

	this.add_this_game = function(data) {
		let _id = data["id"];
		for (let k of Object.keys(this[_id])) {
			this[_id][k] = this[_id][k].concat([data[k]]);
		}
	}

	this.add_new_id = function(data) {
		let _id = data["id"];
		this[_id] = {};
		for (let k of Object.keys(data)) {
			this[_id][k] = [];
		}
	}

	this.add_data = function(data) {
		let _id = data["id"];
		if (this.hasOwnProperty(_id)) {
			let missed_games_from_last_visit = data["game_number"] - this[_id]["id"].length - 1;
			if (missed_games_from_last_visit > 0)
				this.add_missing_games(_id, missed_games_from_last_visit);
			this.add_this_game(data);
		}
		else {
			this.add_new_id(data);
			this.add_missing_games(_id, data["game_number"]-1);
			this.add_this_game(data);
		}
	}

	this.add_missing_last_games = function() {
		for (let keyval of Object.entries(this)) {
			let _id = keyval[0];
			let value = keyval[1];

			if (_id == "num_games") continue;
			if (typeof value !== "object") continue;

			let missed_last_games = this.num_games - value["id"].length
			if (missed_last_games > 0)
				this.add_missing_games(_id, missed_last_games)
		}
	}

	this.calc_avg = function() {
		for (let keyval of Object.entries(this)) {
			let _id = keyval[0];
			let value = keyval[1];

			if (_id == "num_games") continue;
			if (typeof value !== "object") continue;

			let speed = value["speed"];

			let avg_speed = 0;
			let speed_n = speed.reduce((a, b) => a + ((b)?1:0), 0);
			if (speed_n > 0) {
				let speed_sum = speed.reduce((a, b) => a + b||0, 0);
				avg_speed = speed_sum/speed_n;
			}
			this[_id]["avg_speed"] = avg_speed;
			let error_percent = [];
			for (let _s of value["error_percent"]) {
				if (_s !== null) {
					error_percent.push(_s);
				} else {
					error_percent.push(Number.NaN);
				}
			}
			// не должно быть nan, а то сортировка не будет работать
			let avg_error_percent = Infinity;
			let error_n = error_percent.reduce((a, b) => a + (Number.isNaN(b)?0:1), 0);
			if (error_n > 0) {
				let error_sum = error_percent.reduce((a, b) => a + (Number.isNaN(b)?0.0:b), 0.0);
				avg_error_percent = error_sum/error_n;
			}
			this[_id]["avg_error_percent"] = avg_error_percent;
			this[_id]["num_finishes"] = speed_n;
		}
	}
	this.calc_avg_of_array = function(arr, def) {
		if (def===undefined) def = 0;
		let avg = def;
		let n = arr.reduce((a, b) => a + ((Number.isNaN(b)||b===null)?0:1), 0);
		if (n > 0) {
			let sum = arr.reduce((a, b) => a + ((Number.isNaN(b)||b===null)?0.0:b), 0.0);
			avg = sum/n;
		}
		return avg;
	}
	this.calc_finishes_of_array = function(arr) {
		let n = arr.reduce((a, b) => a + ((Number.isNaN(b)||b===null)?0:1), 0);
		return n;
	}
}

let input_values = [];
async function parse() {
	let result = {};
	let errors = [];
	let table = new Table();
	let values = [];
	if (!parse_zip) {
	} else {
		values = input_values;
	}
	for (let i=0; i<values.length; i++) {
		let _file = i+1;
		let _c = values[i];
		let bu = _c.html.split("\n");
		table.num_games += 1;
		let players_in_this_race = [];
		let bad_players = 0;// учет задвоений
		let _data = "";
		for (let line of bu) {
			let data = {};
			if (is_gamedesc_string(line)) {
				let _gdesc = parse_gamedesc(line);
				if (_gdesc) {
					_data = _gdesc;
				}
			}
			if (!is_player_string(line))
				continue;
			let player_strings = split_player_strings(line);

			for (let s of player_strings) {
				if (!is_player_string(s)) continue;
				data["gamedesc"] = _data;
				data["name"] = parse_name(s);
				data["id"] = parse_id(s);
				data["error_percent"] = parse_error_percent(s);
				data["error_count"] = parse_error_count(s);
				data["speed"] = parse_speed(s);
				data["place"] = parse_place(s);
				data["rank"] = parse_rank(s);
				data["award_mileage"] = parse_award_mileage(s);
				data["time"] = parse_time(s);
				data["game_number"] = table.num_games;

				if (kgjs_banned_ids.includes(data["id"])) continue;
				if (data["speed"] < 200) continue;

				if (!players_in_this_race.includes(data["name"])) {
					table.add_data(data);
					players_in_this_race.push(data["name"]);
				}
				else {
					console.log("WARNING: несколько игроков с одним ником в заезде "+ _file +" "+ data["name"]);
					bad_players += 1;
					data["id"] = -bad_players;
					data["name"] = data["name"]+"-BUG"+bad_players.toString();
					errors.push({"type":"doubling","num":bad_players,"id":data["id"],"name":data["name"]});
					table.add_data(data);
				}
			}

		}
	}

	let players = Object.keys(table).filter((key) => !Number.isNaN(parseInt(key)));
	for (let n = 0; n < table.num_games; n++) {
		players.filter((p) => table[p]["place"][n] != null).sort((a, b) => table[a]["place"][n] - table[b]["place"][n]).forEach((p, i) => table[p]["place"][n] = i + 1);
	}

	table.add_missing_last_games();
	table.calc_avg();
	result["table"] = table;
	result["errors"] = errors;
	return result;
}

function items(a) {
	let res = [];
	for (let keyval of Object.entries(a)) {
		let _id = keyval[0];
		let value = keyval[1];

		if (!_id.match(/^\d+$/)) continue;
		if (typeof value !== "object") continue;
		res.push([_id,value]);
	}
	return res;
}

function list_get_last_not_none(_list) {
	let list_filtered = _list.filter(c => c!==null);
	if (list_filtered.length>0)
		return list_filtered[list_filtered.length-1];
	else
		return null;
}

function render_default_table_view(table, sort_func, columns , options={}) {
	let sorted_ids = items(table).sort((a,b) => -sort_func(a) + sort_func(b));
	for (let _i=0;_i<sorted_ids.length;_i++) {
		let x = sorted_ids[_i];
		_id = x[0];
		table[_id]["sort_position"] = _i+1;
	}
	let out_table = [];
	let out_table_format = [];
	let custom_header = "";
	if ((columns.length>0) && (columns[0]["title"]=="custom")) {
		if (columns[0].hasOwnProperty("header")) {
			let h = columns[0]["header"];
			if (h.length > 0) {
				custom_header = h;
			}
		}
	}
	else {
		out_table.push(columns.map(_col => _col["title"] ));
		out_table_format.push(columns.map(_col => "bg-title" ));
	}
	for (let x of sorted_ids) {
		let _id = x[0];
		let out_row = [];
		let out_row_format = [];
		for (let _col of columns) {
			let f = _col["data"];
			let _c = f(table[_id]);
			if (_c===null) _c = "";
			if (Number.isNaN(_c)) _c= "";

			out_row.push(_c)

			let _r = list_get_last_not_none(table[_id]["rank"]);
			if (_col.hasOwnProperty("game")) {
				_r = table[_id]["rank"][_col["game"]];
				if (!_r)
					_r = list_get_last_not_none(table[_id]["rank"]);
			}
			if (_col.hasOwnProperty("add_class")) {
				let add_class = _col["add_class"];
				out_row_format.push("rank-"+_r+" "+add_class);
			} else {
				out_row_format.push("rank-"+_r);
			}
		}
		out_table.push(out_row);
		out_table_format.push(out_row_format);
	}

	let out_table_html = "";
	for (let i=0;i<out_table.length;i++) {
		let r = out_table[i];
		out_table_html += "<tr>";
		for (let j=0;j<r.length;j++) {
			let c = r[j];
			out_table_html += '<td class="'+out_table_format[i][j]+'">'+c+"</td>";
		}
		out_table_html += "</tr>";
	}
	if (custom_header.length > 0)
		out_table_html = custom_header + out_table_html;
	return out_table_html;
}


// calc chat

function gen_default_chat(table, sorted_ids, chat_format, options={}) {
	if (options.hasOwnProperty("re-sort") && options["re-sort"]==true) {
		for (let _i=0;_i<sorted_ids.length;_i++) {
			let x = sorted_ids[_i];
			_id = x[0];
			table[_id]["sort_position"] = _i+1;
		}
	}
	let out_chat_msg = "";
	out_chat_msg += chat_format["title"];
	let f = chat_format["data"];
	for (let x of sorted_ids.slice(0,10)) {
		let _id = x[0];
		let _c = f(table[_id]);
		if (_c===null) _c = "";
		if (Number.isNaN(_c)) _c= "";

		out_chat_msg += _c;
	}

	return out_chat_msg;
}

function gen_default_total(table, sorted_ids, chat_format, options={}) {
	if (options.hasOwnProperty("re-sort") && options["re-sort"]==true) {
		for (let _i=0;_i<sorted_ids.length;_i++) {
			let x = sorted_ids[_i];
			_id = x[0];
			table[_id]["sort_position"] = _i+1;
		}
	}
	let out_chat_msgs = [];
	let out_chat_msg = "";
	out_chat_msg += chat_format["title"];
	let f = chat_format["data"];
	let count = 0;
	for (let x of sorted_ids) {
		let _id = x[0];
		let _c = f(table[_id]);
		if (_c===null) _c = "";
		if (Number.isNaN(_c)) _c= "";

		out_chat_msg += _c;
		count += 1;
		if (count>9) {
			out_chat_msgs.push(out_chat_msg);
			count = 0;
			out_chat_msg = chat_format["title"];
		}
	}
	if (count>0)
		out_chat_msgs.push(out_chat_msg);

	return out_chat_msgs;
}

function gen_default_pers_chat(table, sorted_ids, chat_format, options={}) {
	if (options.hasOwnProperty("re-sort") && options["re-sort"]==true) {
		for (let _i=0;_i<sorted_ids.length;_i++) {
			let x = sorted_ids[_i];
			_id = x[0];
			table[_id]["sort_position"] = _i+1
		}
	}
	let out_chat_pers = {};
	let f = chat_format["data"];
	for (let x of sorted_ids) {
		let _id = x[0];
		let _c = f(table[_id]);
		if (_c===null) _c = "";
		if (Number.isNaN(_c)) _c= "";

		out_chat_pers[list_get_last_not_none(table[_id]["name"])] = _c;
	}

	return out_chat_pers;
}


async function calc() {

	setRules(document.getElementById("kgjs_radios_form").kgjs_rules.value);


	let res = await parse();
	let table = res["table"];
	let num_games = table.num_games

	function num_players(game) {
		let n=0;
		for (let _id of Object.keys(table)) {
			if (table[_id]["game_number"] && table[_id]["game_number"][game]) n+=1;
		}
		return n;
	}
	function gametype(game) {
		let n="";
		for (let _id of Object.keys(table)) {
			if (table[_id]["gamedesc"] && table[_id]["gamedesc"][game]) n=table[_id]["gamedesc"][game];
		}
		return n;
	}
	table.num_players = num_players;
	table.gametype = gametype;
	table.list_get_last_not_none = list_get_last_not_none;

	let valid_game_numbers = [];
	for (let i=0;i<num_games;i++) {
		let f = i+1;
		if (num_players(i)<1) continue;

		valid_game_numbers.push({"n":f,"i":i,"gametype":gametype(i)});
	}
	table.valid_game_numbers = valid_game_numbers;
	table.items = items;
	table.render_default_table_view = render_default_table_view;
	table.gen_image = gen_image;
	let chat_format = {"title":"Промежуточные результаты: ", "data": (x) => x["sort_position"]+". "+list_get_last_not_none(x["name"])+" ("+x["points"].toFixed(0)+"\u200C) "};
	table.default_chat_format = chat_format;
	table.gen_default_chat = gen_default_chat;
	table.gen_default_total = gen_default_total;
	table.gen_default_pers_chat = gen_default_pers_chat;

	let columns = rules[current_rule].columns(table);
	let sort_func = (x) => x[1]["points"]+(x[1]["avg_speed_short"] || 0 + x[1]["avg_speed_usual"] || 0)/5000;
	if (rules[current_rule].hasOwnProperty("sort_func")) {
		sort_func = rules[current_rule].sort_func;
	}

	let html = render_default_table_view(table, sort_func, columns);
	let _t2 = $("kgjs_calc_table");
	_t2.innerHTML = html;
	_t2.className = current_rule;
	$("kgjs_custom_block").className = current_rule;

	if (!rules[current_rule].hasOwnProperty("chat") || !rules[current_rule].chat) return;

	let sorted_ids = items(table).sort((a,b) => -sort_func(a) + sort_func(b));
	let sorted_ids_filtered = sorted_ids.filter(c => table[c[0]]["points"]>0);

	let msgs = [gen_default_chat(table, sorted_ids_filtered, chat_format)];

	function pers_msgs(x, sorted_ids, options={}) {

		if (options.hasOwnProperty("re-sort") && options["re-sort"]==true) {
			for (let _i=0;_i<sorted_ids.length;_i++) {
				let _x = sorted_ids[_i];
				_id = _x[0];
				table[_id]["sort_position"] = _i+1;
			}
		}

		let first_string = "Обработан";
		let second_string = "заезд";
		let num_full_games = num_games-1;
		if (num_full_games>1)
			first_string += "о";
		if ((num_full_games == 2) || (num_full_games == 3) || (num_full_games ==4))
			second_string += "а";
		if (num_full_games > 4)
			second_string += "ов";
		let string_zaezdov = first_string+" "+num_full_games+" "+second_string+", ";

		let n = list_get_last_not_none(x["name"]);
		let _points = x["points"].toFixed(0);
		let _doezdov = x["num_finishes"];
		let _pos = x["sort_position"];
		let _i = _pos-1;
		let out_messages = [];
		out_messages.push("\u200C"+_pos+". "+n.replaceAll('_','\\_')+
		    " ("+_points+"\u200C"+"). "+
		    string_zaezdov +
		    "доездов: "+_doezdov+"/"+num_full_games);
		if (_i+1>9) {
			let prev_id = sorted_ids[_i-1][0];
			let prev_n = list_get_last_not_none(table[prev_id]["name"]);
			let prev_points = table[prev_id]["points"].toFixed(0);
			let near = "Ближайшие соперники: "+_i+". "+
			    prev_n.replaceAll('_','\\_')+
			    " ("+prev_points+"\u200C"+"). "+
			    (_i+1).toString()+". "+
			    n.replaceAll('_','\\_')+
			    " ("+_points+"\u200C"+"). ";
			if (_i+1<sorted_ids.length) {
				let next_id = sorted_ids[_i+1][0];
				let next_n = list_get_last_not_none(table[next_id]["name"]);
				let next_points = table[next_id]["points"];
				near = near +
				    (_i+2).toString()+". "+
				    next_n.replaceAll('_','\\_')+
				    " ("+next_points+"\u200C"+"). ";
			}
			out_messages.push(near);
		}
		return out_messages;

	}
	let pers_chat_format = {"title:":"", "data": (x,_i=sorted_ids) => pers_msgs(x,_i)};
	let pers_chat_msgs = gen_default_pers_chat(table, sorted_ids, pers_chat_format);

	let chat_format_total = chat_format;
	chat_format_total["title"] = "Предварительные итоги: ";
	let sorted_ids_total = sorted_ids_filtered;
	let total_msgs = gen_default_total(table, sorted_ids_total, chat_format_total, {"re-sort":true});

	table.sorted_ids_filtered = sorted_ids_filtered;
	table.sorted_ids = sorted_ids;
	table.default_pers_msgs = pers_msgs;

	if (rules[current_rule].hasOwnProperty("chat_msgs")) {
		let res = rules[current_rule].chat_msgs(table);
		if (res.hasOwnProperty("total_msgs")) {
			total_msgs = res["total_msgs"];
		}
		if (res.hasOwnProperty("msgs")) {
			msgs = res["msgs"];
		}
		if (res.hasOwnProperty("pers_chat_msgs")) {
			pers_chat_msgs = res["pers_chat_msgs"];
		}
	}

	kgjs_pers_messages = pers_chat_msgs;
	kgjs_inter_results = msgs.map(x => x.replaceAll('_','\\_'));
	kgjs_total_results = total_msgs.map(x => x.replaceAll('_','\\_'));

	//console.log("kgjs_pers_messages", kgjs_pers_messages);
	//console.log("kgjs_inter_results", kgjs_inter_results);
	//console.log("kgjs_total_results", kgjs_total_results);
	chat();
};
calc();





}

var s5 = document.createElement("script");
s5.type = "text/javascript";
s5.src = "https://cdnjs.cloudflare.com/ajax/libs/dom-to-image/2.6.0/dom-to-image.min.js";
//s5.src = "https://cdn.jsdelivr.net/npm/dom-to-image-more@2.9.5/dist/dom-to-image-more.min.js";
var s5_loaded = false;
s5.onload = () => {s5_loaded = true; work() };
document.body.append(s5);



})();
