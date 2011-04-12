// ==UserScript==
// @name           VKontakte Audio Download Link + Magnet for Shareaza
// @description    Adds a download link and magnet with artist and title to VKontakte audio search.
// @include        http://vkontakte.ru/*
// @include        http://vk.com/*
// ==/UserScript==

var track_list = [];

var dl_img = "data:image/gif;base64,R0lGODlhEAAQAJEAAF99nZqxxv///////yH5BAEAAAMALAAAAAAQABAAAAIjXICpGLafzhJUwFmv3qBa7nFdpnkhZJKoCaobJXKS2MxaUwAAOw==";

var dl_mag = "data:image/gif;base64,R0lGODlhEAAQAKEAAF99nZqxxv///wAAACH5BAQAAP8ALAAAAAAQABAAAAIoVICpGLafDpxJWGXFy/jSj3CV12mjWaaLGJJnBkNwPM0oCEl4o1NNAQAh/oIBVVNTUENNVAA7"

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

function add_link(root, link, dl_img, alt, title)
{
	var atag, img;
	atag = document.createElement('a');
	atag.href = link;
	atag.title = title || "";
	img = document.createElement('img');
	img.src = dl_img;
	img.alt = alt || "";
	img.style.display = "inline";
	img.style.cssFloat = "right";
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

function find_tracks(new_only, arg, call_back)
{
	var li = document.getElementsByClassName("play_new");
	for (var i = 0; i < li.length; i++) {
		var play = li[i];
		if ( play && ((play.getAttribute('vde') != 'true') || ! new_only) ) {
			var root, span, b, input, title_wrap, duration,
				link, artist, title;
				
			if (new_only) play.setAttribute('vde', 'true');
			
			root = play.parentNode.parentNode.parentNode;
			title_wrap = root.getElementsByClassName("title_wrap")[0] || root.getElementsByClassName("info")[0];
			span = root.getElementsByTagName("span")[0];
			b = root.getElementsByTagName("b")[0];
			input = root.getElementsByTagName("input")[0];
			duration = root.getElementsByClassName("duration")[0];
			
			artist = get_text(b);
			title = get_text(span);
			link = input.value.split(',')[0] + "#/" + encodeURIComponent(artist+" - "+title+".mp3");
			
			duration = get_text(duration).split(':');
			
			var seconds = 0, j = 0;
			if (duration.length == 3) seconds += duration[j++] * 60 * 60;
			if (duration.length > 1) seconds += duration[j++] * 60;
			
			seconds += duration[j++]*1;
			
			call_back(root, title_wrap, artist, title, seconds, link, arg)
		}
	}
}

function add_links(root, insert_node, artist, title, seconds, link, arg)
{
	// simple link
	add_link(insert_node, link, dl_img, "↓↓", "Download/Загрузить");
	
	// Shareaza magnet with artist and title for download
	// from Shareaza (shareaza.sf.net)
	add_link(insert_node, get_magnet(link, artist + " - " + title + ".mp3") , dl_mag, "U", "Download/Загрузить by Shareaza (shareaza.sf.net)");
}

var nl = encodeURIComponent('\n');

function make_m3u() {
	var buff = [];
	buff.push("data:audio/x-mpegurl;charset=utf-8,")
	buff.push(encodeURIComponent('#EXTM3U\n'));
	
	find_tracks(false, buff, function(root, insert_node, artist, title, seconds, link, buff){
		var track = encodeURIComponent(artist+" - "+title)
		buff.push(encodeURIComponent('#EXTINF:'), seconds, ',', track, nl)
		buff.push(encodeURIComponent(link) , nl, nl)
	})
	
    window.open(buff.join(""), "_blank")
	
	return true;
}

function make_pls() {
	var buff = [];
	buff.push("data:audio/x-scpls;charset=utf-8,")
	buff.push(encodeURIComponent('[playlist]\n\n'));
	var arg = {buff: buff, index: 1}
	find_tracks(false, arg, function(root, insert_node, artist, title, seconds, link, arg){
		var track = encodeURIComponent(artist+" - "+title)
		arg.buff.push("File", arg.index, "=", encodeURIComponent(link) , nl)
		arg.buff.push("Title", arg.index, "=", track, nl)
		arg.buff.push("Length", arg.index++, "=", seconds, nl, nl)
    })
	
	buff.push("NumberOfEntries=", arg.index - 1, encodeURIComponent("\nVersion=2\n\n"))
	
    window.open(buff.join(""), "_blank")
	
	return true;
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
			divtag.appendChild(add_href("(m3u)", make_m3u));
			divtag.appendChild(add_href("(pls)", make_pls));
			insert_element.appendChild(divtag);	
		}
	}
	
	find_tracks(true, false, add_links)
}

setInterval(refresh, 1000);
