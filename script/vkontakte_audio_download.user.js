// ==UserScript==
// @name           VKontakte Audio Download Link + Magnet for Shareaza
// @description    Adds a download link and magnet with artist and title to VKontakte audio search.
// @include        http://vkontakte.ru/*
// @include        http://vk.com/*
// ==/UserScript==

var track_list = [];

var h="data:image/gif;base64,R0lGODlhEAAQA",a="ALAAAAAAQABAAAAI";
var dl_img = h+"KEAAGCAoP7+/gAAAAAAACH5BAEAAAI"+a+"eFI6Zpu0YYnhJToqfzWBnr1lSKF5O+Y1cxLUuwwkFADs=";
var dl_mag = h+"JAAAGGAoP7+/iH5BAQAAP8"+a+"jDI6Zpu3/glxTSXYu3Ej3SmGAF5YWOKLZxaprK54sR9ejHRQAOw==";

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

function add_href(text, fnc){
	var atag = document.createElement('a');
	atag.href = "javascript: void(0);";
	atag.textContent = text;
	atag.addEventListener("click", fnc, false);
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
	var li = document.getElementsByClassName("audio");
	
	for (var i = 0, play; i < li.length; i = (play == li[i] && (i + 1)) || i) {
		play = li[i]
		if ( play && ((play.getAttribute('vde') != 'true') || ! new_only) ) {
			var root = audio_node(play);
			
			if ( root && root.parentNode ) {
				if (new_only) play.setAttribute('vde', 'true');
				var title_node, artist_node, input, title_wrap, duration,
				orig_link, link, artist, title;
				
				title_wrap = root.getElementsByClassName("title_wrap")[0] || root.getElementsByClassName("info")[0];
				title_node = root.getElementsByClassName("title")[0] || root.getElementsByTagName("span")[0];
				artist_node = root.getElementsByTagName("b")[0];
				input = root.getElementsByTagName("input")[0];
				duration = root.getElementsByClassName("duration")[0];
				
				artist = get_text(artist_node);
				title = get_text(title_node);
				link = input.value.split(',')[0];
				
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

	insert_node.appendChild(title_style(add_href("(up)", to_top)));
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
function add_command(name, funct, parent)
{
	parent.appendChild(add_href(name, funct));
	if (!gm_menu_flag[funct]) {
		GM_registerMenuCommand(name, funct);
		gm_menu_flag[funct] = name;
	}
}

function refresh() {
	var playlists = document.getElementById("playlists");
	
	if (!playlists) {
		var insert_element = document.getElementById("left_blocks") || document.getElementById("side_panel") || document.getElementById("filters");
		if (insert_element){
			var divtag;
			divtag = document.createElement('div');
			divtag.className = "side_filter";
			divtag.id = "playlists";
			
			add_command("(m3u)", make_m3u,divtag);
			add_command("(pls)", make_pls,divtag);
			var atag = add_href("", reset_index);
			atag.id = "pl_index";
			divtag.appendChild(atag);
			reset_index({target: atag});
			divtag.appendChild(document.createElement("br"));
			add_command("(remove_copy)", remove_copys,divtag);
			divtag.appendChild(document.createElement("br"));
			add_command("(artist)", remove_artist,divtag);
			add_command("(title)", remove_title,divtag);
			insert_element.appendChild(divtag);	
		}
	}
	
	find_tracks(true, false, add_links)
}

setInterval(refresh, 1000);
