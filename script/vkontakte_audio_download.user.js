// ==UserScript==
// @name           VKontakte Audio Download Link + Magnet for Shareaza
// @description    Adds a download link and magnet with artist and title to VKontakte audio search.
// @include        http://vkontakte.ru/*
// @include        http://vk.com/*
// ==/UserScript==

var h="data:image/gif;base64,R0lGODlhEAAQA",a="ALAAAAAAQABAAAAI";
var dl_img = h+"KEAAGCAoP7+/gAAAAAAACH5BAEAAAI"+a+"eFI6Zpu0YYnhJToqfzWBnr1lSKF5O+Y1cxLUuwwkFADs=";
var dl_mag = h+"JAAAGGAoP7+/iH5BAQAAP8"+a+"jDI6Zpu3/glxTSXYu3Ej3SmGAF5YWOKLZxaprK54sR9ejHRQAOw==";
/*
function my_test()
{
	function u(s){
		var r=[],e=/(<|(>))([^<>]*)/g,a,m=0,i=0,l=0,j,t,x;
		while((m!=i)||((a=e.exec(s))&&(m=((t=a[3],a[2])?(i=l,0):i+1),1))||(m=l,y++))(m||t)?(x=(r[i]||(l=(i+1),[])),r[i]=(y?(x.push(t),x):x.join(""))):(l--,i=0);
		return r
	}
	
	function u1(s,o){
		var r=[],e=/(<|(>))([^<>]*)/g,a=e.exec(s),i=0,d=0,m=0,t,y,x,c=0,z=0;
		while(z<4||(i!=m)){
			((z<0)&&(z=((t=a[3])?2:0)+(a[2]?1:0)),
				x=(z>2)?
					(i==m)?
						(i=r.length-d,m=0):
						r[--i]
				:
					z!=1?
						r[m++]=r[i++]||[]:
						(d++,0)
				,
				x&&t&&(z<4?
						x.push(t):
						t[i]=x.join("")
				),
				(i==m)&&(z<4)&&(
					(z=-1,a=e.exec(s))||
					(d=0,t=[],z=4)
				)
			)
			if(c++>31){
				alert(z);
				break;
			}
		}
		
		return o?t.join(""):t
	}
	
	var t = u1("<<>data:image/gif;base64,R0lGODlhEAAQA<KEAAGC<JAAAGG>AoP7+/<gAAAAAAACH5BAEAAAI<iH5BAQAAP8>ALAAAAAAQABAAAAI<eFI6Zpu0YYnhJToqfzWBnr1lSKF5O+Y1cxLUuwwkFADs=<jDI6Zpu3/glxTSXYu3Ej3SmGAF5YWOKLZxaprK54sR9ejHRQAOw==");
	alert(t);
}*/

function get_text(node){
    return node.text || node.textContent || (function(node){
        var _result = "";
        if (node == null) {
            return _result;
        }
        var childrens = node.childNodes;
        var i = 0;
        while (i < childrens.length) {
            var child = childrens.item(i);
            switch (child.nodeType) {
                case 1: // ELEMENT_NODE
                case 5: // ENTITY_REFERENCE_NODE
                    _result += arguments.callee(child);
                    break;
                case 3: // TEXT_NODE
                case 2: // ATTRIBUTE_NODE
                case 4: // CDATA_SECTION_NODE
                    _result += child.nodeValue;
                    break;
                case 6: // ENTITY_NODE
                case 7: // PROCESSING_INSTRUCTION_NODE
                case 8: // COMMENT_NODE
                case 9: // DOCUMENT_NODE
                case 10: // DOCUMENT_TYPE_NODE
                case 11: // DOCUMENT_FRAGMENT_NODE
                case 12: // NOTATION_NODE
                // skip
                break;
            }
            i++;
        }
        return _result;
    }(node));
}

function get_magnet(link, file) {
	return "magnet:?as="+encodeURIComponent(link)+"&dn="+encodeURIComponent(file);
}

function title_style(obj){
	obj.style.display = "block";
	obj.style.cssFloat = "right";
	return obj;
}

function add_link(root, link, dl_img, alt, title)
{
	var atag, img;
	atag = document.createElement('a');
	atag.href = link;
	atag.title = title || "";
	img = document.createElement('img');
	img.src = dl_img;
	img.alt = alt || "";
	title_style(atag);
	atag.appendChild(img);
	root.appendChild(atag);
}

function add_href(text, fnc, href, target, title){
	var atag = document.createElement('a');
	atag.href = href || "javascript: void(0);";
	atag.textContent = text;
	if(fnc) atag.addEventListener("click", fnc, false);
	if(target) atag.target = target;
	if(title) atag.title = title;
	return atag
}

function audio_node(child)
{
	var audio = child;
	while ( audio && !(audio.id && audio.id.indexOf("audio")==0 && audio.id.indexOf("audio_")==-1) )
		audio = audio.parentNode;
	return audio;
}

function find_tracks(new_only, arg, call_back)
{
	var tagN="getElementsByTagName", classN="getElementsByClassName"
	var li = document[classN]("audio");
	
	for (var i = 0, play; i < li.length; i = (play == li[i] && (i + 1)) || i) {
		play = li[i]
		if ( play && ((play.getAttribute('vde') != 'true') || ! new_only) ) {
			var root = audio_node(play);
			
			if ( root && root.parentNode ) {
				if (new_only) play.setAttribute('vde', 'true');
				var title_node, artist_node, input, title_wrap, duration,
				orig_link, link, artist, title;
				
				title_wrap = root[classN]("title_wrap")[0] || root[classN]("info")[0];
				title_node = root[classN]("title")[0] || root[tagN]("span")[0];
				artist_node = root[tagN]("b")[0][tagN]("a")[0];
				input = root[tagN]("input")[0];
				duration = root[classN]("duration")[0];
				
				artist = get_text(artist_node);
				title = get_text(title_node);
				link = input.value.split(',')[0];

				if(new_only) artist_node.href = "/audio?q="+encodeURIComponent(artist);
				
				duration = get_text(duration).split(':');
				
				var seconds = 0, j = 0;
				if (duration.length == 3) seconds += duration[j++] * 60 * 60;
				if (duration.length > 1) seconds += duration[j++] * 60;
				
				seconds += duration[j++]*1;
				
				call_back(arg, root, title_wrap, artist, title, seconds, link)
			}
		}
	}
}
var play_list_index = 0;

function reset_index(event){
	play_list_index = 0;
	event.target.textContent = "(0)";
}

function to_top(event){
	var audio = audio_node(event.target);
	if (!audio)
		return;
	var list = audio.parentNode;
	list.insertBefore(audio, list.childNodes[play_list_index++]);
	document.getElementById("pl_index").textContent = "("+play_list_index+")";
}

function extend_link(link, file_name)
{
	return link + "#/" + encodeURIComponent(file_name);
}

function get_file_name(artist, title)
{
	return artist+" - "+title+".mp3";
}

function add_links(arg, root, insert_node, artist, title, seconds, link, orig_link)
{
	var file_name = get_file_name(artist, title);
	// simple link
	add_link(insert_node, extend_link(link, file_name), dl_img, "↓↓", "Download/Загрузить");
	
	// Shareaza magnet with artist and title for download
	// from Shareaza (shareaza.sf.net)
	add_link(insert_node, get_magnet(link, file_name) , dl_mag, "U", "Download/Загрузить by Shareaza (shareaza.sf.net)");

	insert_node.appendChild(title_style(add_href("(up)", to_top,0,0,"Поднять трек наверх в списке.")));
}

var re = / /g, es = "";
function clear_string(str){
	return str.toLowerCase().replace(re,es);
}

function get_search_query(){
	return (document.getElementById("search_query") || document.getElementById("s_search")).value;
}

function remove_artist(){
	find_tracks(false, clear_string(get_search_query()), function (search_query, root, insert_node, artist, title, seconds, link, orig_link){
		if (clear_string(artist) != search_query)
			root.parentNode.removeChild(root);
	})
}

function remove_title(){
	find_tracks(false, clear_string(get_search_query()), function (search_query, root, insert_node, artist, title, seconds, link, orig_link){
		if (clear_string(title) != search_query)
			root.parentNode.removeChild(root);
	})
}
	
function remove_copys()
{
	find_tracks(false, {}, function (artists, root, insert_node, artist, title, seconds, link){
		if (!(title && artist && seconds)) return;

		artist = clear_string(artist);
		title = clear_string(title);
		if (!artists[artist]){
			artists[artist] = {};
		}else if (artists[artist][title] && (artists[artist][title] != root) ){
			root.parentNode.removeChild(root);
			return;
		}
		
		artists[artist][title] = root;
	})
}


var nl = encodeURIComponent('\n');


function utf_to_1251_uri (utf_str) {
    var buf = [];
    for (var i = 0, code = 0; i < utf_str.length; i++) {
        code = utf_str.charCodeAt(i);
        if (code > 127) {
            if (code > 1024) {
                if (code == 1025)
                    code = 1016;
                else if (code == 1105)
                    code = 1032;
				else if (code > 1103)
					continue;
                buf.push("%",(code - 848).toString(16));
            }
        } else
            buf.push(encodeURIComponent(utfstr.charAt(i)));
    }
    return buf.join("");
}

function make_m3u() {
	var buff = [];
	buff.push("data:audio/x-mpegurl;charset=utf-8,")
	buff.push(encodeURIComponent('#EXTM3U\n'));
	
	find_tracks(false, buff, function(buff, root, insert_node, artist, title, seconds, link){
		var track = utf_to_1251_uri(artist+" - "+title)
		buff.push(encodeURIComponent('#EXTINF:'), seconds, ',', track, nl)
		buff.push(link,"#/",track,".mp3", nl, nl)
	})
	
    window.open(buff.join(""), "_blank")
	
	return true;
}

function make_pls() {
	var buff = [];
	buff.push("data:audio/x-scpls;charset=utf-8,")
	buff.push(encodeURIComponent('[playlist]\n\n'));
	var arg = {buff: buff, index: 1}
	find_tracks(false, arg, function(arg, root, insert_node, artist, title, seconds, link){
		var track = encodeURIComponent(artist+" - "+title)
		arg.buff.push("File", arg.index, "=", link , nl)
		arg.buff.push("Title", arg.index, "=", track, nl)
		arg.buff.push("Length", arg.index++, "=", seconds, nl, nl)
    })
	
	buff.push("NumberOfEntries=", arg.index - 1, encodeURIComponent("\nVersion=2\n\n"))
	
    window.open(buff.join(""), "_blank")
	
	return true;
}

var gm_menu_flag = {};
function add_command(name, funct, parent, help)
{
	parent.appendChild(add_href(name, funct,0,0,help));
	if (!gm_menu_flag[funct]) {
		GM_registerMenuCommand(name, funct);
		gm_menu_flag[funct] = name;
	}
}

function vk_like_show(){
	var vk_like = document.getElementById("audio_script_like");
	if (vk_like.style.visibility == "hidden")
		vk_like.style.visibility = "visible";
	else
		vk_like.style.visibility = "hidden";
		
}

var pl_divtag;
function refresh() {
	var playlists = document.getElementById("playlists");
	
	
	if(unsafeWindow.VK && playlists &&!(document.getElementById("audio_script_like"))){
		var vk_like = document.createElement('div');
		vk_like.id = "audio_script_like";
		vk_like.style.visibility = "hidden";
		vk_like.style.cssFloat = "right";
		playlists.insertBefore(vk_like, playlists.childNodes[0]);
		unsafeWindow.VK.init({apiId: 2000010, onlyWidgets: true});
		unsafeWindow.VK.Widgets.Like("audio_script_like", {
			type: "vertical", 
			pageUrl: "http://userscripts.org/scripts/show/100073",
			pageTitle: "1.24 VKontakte Audio Download, Playlist, Artist-Title filter",
			pageDescription: 
'1. Добавляет прямую ссылку на mp3 ВКонтакте.\
2. Позволяет воспроизвести плейлист контакта во внешнем mp3 плеере.\
3. Есть фильтры результатов поиска по исполнителю и композиции.',
			pageImage: "http://img832.imageshack.us/img832/3415/tryad.th.jpg"
		}, 26);
	}
	
		
	if (!playlists) {
		var insert_element = document.getElementById("side_bar") || document.getElementById("left_blocks") || document.getElementById("side_panel") || document.getElementById("filters");
		if (insert_element){
			if (!pl_divtag){
				pl_divtag=document.createElement('div');
				var divtag=pl_divtag;
				//divtag.className = "side_filter";
				divtag.id = "playlists";
				add_command("(m3u)", make_m3u,divtag,"создать список воспроизведения (треклист) m3u");
				add_command("(pls)", make_pls,divtag,"создать список воспроизведения (треклист) pls");
				var atag = add_href("", reset_index,0,0,"сбросить позицию для поднятия трека");
				atag.id = "pl_index";
				divtag.appendChild(atag);
				
				divtag.appendChild(document.createElement("br"));
				add_command("(remove_copy)", remove_copys, divtag, "убрать треки с одинаковыми названиями");
				divtag.appendChild(document.createElement("br"));
				add_command("(artist)", remove_artist, divtag, "оставить треки атриста заданного в строке поиска");
				add_command("(title)", remove_title, divtag, "оставить треки c названием заданным в строке поиска");
				//add_command("(t)", my_test,divtag);
				var p = document.createElement("p");
				p.appendChild(add_href("script home",0,"http://userscripts.org/scripts/show/100073", "_blank","открыть домашнюю страницу скрипта"));
				p.appendChild(document.createTextNode(" "));
				var heart = add_href("♥",vk_like_show,0,0,"поставь сердечко и раскажи друзьям )) (появится кнопка, скрыть второй раз нажми)");
				heart.style.fontSize="medium";
				heart.style.fontWeight="bold";
				p.appendChild(heart);
				divtag.appendChild(p);
			}
			
			if(insert_element.id=="side_bar")
				insert_element.insertBefore(pl_divtag, insert_element.getElementsByTagName("OL")[0].nextElementSibling);
			else
				insert_element.appendChild(pl_divtag);
			
			reset_index({target: document.getElementById("pl_index")});
		}
	}
	
	find_tracks(true, false, add_links)
}

var vk_like_script = document.createElement("script");
vk_like_script.src = "http://userapi.com/js/api/openapi.js?29";
vk_like_script.type = "text/javascript";

document.getElementsByTagName('head')[0].appendChild(vk_like_script);
setInterval(refresh, 1000);
