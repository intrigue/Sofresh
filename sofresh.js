<?php

define('SOFRESH_VERSION', '1.0.1');

if (isset($_GET['nocache']))
	define('SOFRESH_LAST_MODIFIED', gmdate('D, d M Y H:i:s', time()) . ' GMT');
else
	define('SOFRESH_LAST_MODIFIED', gmdate('D, d M Y H:i:s', getlastmod()) . ' GMT');

$baseUrl = 'http://'.$_SERVER['HTTP_HOST'].dirname($_SERVER['REQUEST_URI']);

header('Content-Type: text/javascript; charset=UTF-8');
header('Last-Modified: '.SOFRESH_LAST_MODIFIED);

# Minified CSS
$css = file_get_contents(dirname(__FILE__).'/css/sofresh.css');
$css = str_replace("\n", ' ', $css);
$css = str_replace("\t", ' ', $css);
$count = 1;
while ($count) $css = str_replace('  ', ' ', $css, $count);

# Functions
require_once dirname(__FILE__).'/php/sofresh.php';

?>
/*!
 *               _       _ _
 *              | |     (_) |                _  
 *  _ __ ___  __| |_ __  _| | __  _ __   ___| |_ 
 * | '__/ . \/ _` | '_ \| | |/ / | '_ \ / . \  _)
 * | | |  __/ (_) | (_) ) |   ( _| | | (  __/ |_ 
 * |_|  \___|\__,_| .__/|_|_|\_(_)_| |_|\___|\__)
 *                |_|                            
 * 
 * SoFresh!
 * Version: <?php echo SOFRESH_VERSION."\n"; ?>
 * Last-Modified: <?php echo SOFRESH_LAST_MODIFIED."\n"; ?>
 * 
 * jQuery:
 *  - Copyright (c) jquery.com
 *  - http://jquery.org/license
 * 
 * phpjs:
 *  - MIT + GPL: http://phpjs.org/pages/license
 *  - http://phpjs.org/
 * 
 * CSSrefresh:
 *  - Copyright (c) 2012 Fred Heusschen
 *  - http://www.frebsite.nl/
 * 
 * Icon set:
 *  - The Creative Commons Attribution-NonCommercial
 *  - http://gentleface.com/
 * 
 * SoFresh:
 *  - Copyright (c) 2012 Benjamin Pongy & Nicolas Sorosac & Sylvain Gougouzian
 *  - http://www.redpik.net/
 * 
 * Dual licensed under the MIT and GPL licenses:
 *  - http://en.wikipedia.org/wiki/MIT_License
 *  - http://en.wikipedia.org/wiki/GNU_General_Public_License
 */
(function(){
	
	<?php include_once dirname(__FILE__).'/js/jquery.js'; ?>

	<?php include_once dirname(__FILE__).'/js/php.js'; ?>
	
	// if we call the bookmarlet several times: clean everything!
	if (typeof $sf == 'undefined') $sf = jQuery.noConflict(true);
	if (typeof window.soFresh == 'function') window.soFreshDestroy();
	
	/**
	 * SoFresh destructor
	 */
	window.soFreshDestroy = function() {
		// timeout
		clearTimeout(window.soFresh.reload_timeout);
		// remove random param at the end of link URLs
		var links = document.getElementsByTagName('link');
		for (i=0; i<links.length; i++) {
			links[i].href = links[i].href.replace(/([&\?]{1}sofresh-rand=[0-9\.]*)+/i, '');
		}
		// object
		window.soFresh = null;
		// events
		$sf(window).off('resize.sofresh');
		$sf(document).off('mousemove.sofresh');
		$sf('#sofresh_header').off('mousedown');
		$sf('#sofresh_header').off('mouseup');
		$sf('#sofresh_links input:checkbox').off('change');
		$sf('#sofresh_links label').off('click');
		$sf('#sofresh_close').off('click');
		$sf('#sofresh_content_toggler').off('click');
		$sf('#sofresh_check_all').off('click');
		$sf('#sofresh_uncheck_all').off('click');
		// elements
		$sf('#sofresh').remove();
		$sf('#sofresh-style').remove();
		return false;
	};
	
	/**
	 * SoFresh constructor
	 */
	window.soFresh = function(){

		this.initialized = false;
		this.container = null;
		this.reload_timeout = null;
		this.reload_delay = 1000;
		this.links = [];
		this.active_files = [];
		this.expanded = true;
		this.position = { left: 0, top: 0 };

		this.reloadFile = function(links) {
			clearTimeout(this.reload_timeout);
			for (var a = 0, l = links.length; a < l; a++) {
				var link = links[a], new_time = phpjs.filemtime(this.getRandom(link.href));
				// has been checked before or first try
				if ((link.last || !this.initialized) || link.force_refresh) {
					// has been changed or first try
					if ((link.last != new_time || !this.initialized) || link.force_refresh) {
						// reload
						link.elem.setAttribute('href', this.getRandom(this.getHref(link.elem)));
						if (this.initialized) {
							elem = $sf('#sofresh_links label[for="sofresh_link_' + $sf(link.elem).data('sofresh-link') + '"]').parents('li');
							elem.addClass('sofresh-highlight');
							setTimeout(function(){ elem.removeClass('sofresh-highlight'); }, 1100);
						}
					}
				}
				// set last time checked
				link.last = new_time;
				link.force_refresh = false;
			}
			if (!this.initialized) this.initialized = true;
			this.reload_timeout = setTimeout(function(){
				this.reloadFile(links);
			}, this.reload_delay);
		};

		this.getHref = function(f){
			return f.getAttribute('href');
		};

		this.isLocalHref = function(href){
			if (href == null) return false;
			var bootstrap_regexp = /bootstrap(-responsive)?(\.min)?\.css/i;
			return !(
				(href.indexOf('//') > -1 && href.indexOf('//') <= 6 && href.indexOf('//'+location.hostname+'/') == -1) ||
				href.indexOf('chrome-extension://') > -1 ||
				href.indexOf('data:text/css') > -1 ||
				bootstrap_regexp.test(href)
			);
		};

		this.getFiletime = function (cssFile) {
			var time = 0;
			$.ajax({
				type: "HEAD",
				async: true,
				url:  cssFile,
				success: function(message,text,response){
					time = response.getResponseHeader('Last-Modified');
				}
			});
			return time;
		};

		this.getRandom = function(f){
			f = f.replace(/([&\?]{1}sofresh-rand=[0-9\.]*)+/i, '');
			return (f.indexOf('?') > -1) ?
				f + '&sofresh-rand=' + Math.random() :
				f + '?sofresh-rand=' + Math.random() ;
		};

		this.setCookie = function(name, value){
			var argv    = this.setCookie.arguments;
			var argc    = this.setCookie.arguments.length;
			var expires = (argc > 2) ? argv[2] : null;
			var path    = (argc > 3) ? argv[3] : null;
			var domain  = (argc > 4) ? argv[4] : null;
			var secure  = (argc > 5) ? argv[5] : false;
			document.cookie = name+"="+escape(value) +
				(expires == null  ? "" : "; expires="+expires.toGMTString()) +
				(path    == null  ? "" : "; path="+path) +
				(domain  == null  ? "" : "; domain="+domain) +
				(secure  == false ? "" : "; secure");
		};

		this.getCookieVal = function(offset){
			var endstr = document.cookie.indexOf (";", offset);
			if (endstr==-1) endstr=document.cookie.length;
			return unescape(document.cookie.substring(offset, endstr));
		};

		this.getCookie = function(name){
			var arg  = name+"=";
			var alen = arg.length;
			var clen = document.cookie.length;
			var i = 0;
			while (i<clen) {
				var j = i+alen;
				if (document.cookie.substring(i, j)==arg) return this.getCookieVal(j);
				i = document.cookie.indexOf(" ",i)+1;
				if (i==0) break;
			}
			return null;
		};

		this.getDoNotTrack = function(){
			if (navigator.doNotTrack) {
				return (navigator.doNotTrack == 1 || navigator.doNotTrack == true || navigator.doNotTrack == 'yes');
			} else if (navigator.msDoNotTrack) {
				return (navigator.msDoNotTrack != 0);
			} else {
				return false;
			}
		};

		this.toggleContent = function(){
			this.container.toggleClass('sofresh-expanded');
			this.container.toggleClass('sofresh-collapsed');
			this.expanded = this.container.hasClass('sofresh-expanded');
			this.saveState();
			return false;
		};

		this.checkAll = function(){
			$sf('#sofresh_links input:checkbox').attr('checked', 'checked').first().trigger('change');
			return false;
		};

		this.uncheckAll = function(){
			$sf('#sofresh_links input:checkbox').removeAttr('checked').first().trigger('change');
			return false;
		};

		this.reposition = function(){
			if (this.position.left + this.container.width() > document.body.clientWidth) {
				this.position.left = document.body.clientWidth - this.container.width() - 50;
				this.container.css('left', this.position.left);
			}
		};

		this.saveState = function() {
			if (navigator.cookieEnabled) {
				var selected_files = [];
				$sf('#sofresh_links input:checked').each(function(){
					selected_files.push($sf(this).parents('li').attr('title'));
				});
				this.active_files = selected_files;
				var sofresh_state = {
					'active_files' : this.active_files.join(','),
					'expanded'     : this.expanded,
					'position'     : this.position
				};
				var date_exp = new Date();
				date_exp.setTime(date_exp.getTime()+(365*24*3600*1000));
				this.setCookie(
					'sofresh_state', JSON.stringify(sofresh_state), date_exp,
					location.pathname.substring(0, location.pathname.lastIndexOf('/')) +'/'
				);
			}
		};

		this.initState = function(){
			if (navigator.cookieEnabled) {
				var sofresh_state_cookie = this.getCookie('sofresh_state');
				if (sofresh_state_cookie !== null) {
					var sofresh_state  = JSON.parse(sofresh_state_cookie);
					this.active_files  = sofresh_state.active_files.split(',');
					this.expanded      = sofresh_state.expanded;
					this.position      = sofresh_state.position;
				}
			}
			if (this.expanded === false) {
				this.container.removeClass('sofresh-expanded').addClass('sofresh-collapsed');
			}
			this.container.css({ top: this.position.top, left: this.position.left });
		};

		this.initDragAndDrop = function() {
			var $this = this,
				initX = false,
				initY = false;
			$sf(document).on('mousemove.sofresh', function(event){
				if ($this.container.hasClass('sofresh-movable')) {
					event.preventDefault();
					if (!initX) initX = event.pageX;
					if (!initY) initY = event.pageY;
					var thisX = event.pageX - initX;
					var thisY = event.pageY - initY;
					initX = event.pageX;
					initY = event.pageY;
					$sf('.sofresh-movable').css({ left: '+=' + thisX, top: '+=' + thisY });
				}
			});
			$sf('#sofresh_header').on('mousedown', function(event){
				event.preventDefault();
				$this.container.addClass('sofresh-movable');
			}).on('mouseup', function(){
				$this.container.removeClass('sofresh-movable');
				initX = false;
				initY = false;
				var position = $this.container.position();
				$this.position = {
					top:  position.top  - $sf(document).scrollTop(),
					left: position.left - $sf(document).scrollLeft()
				};
				$this.saveState();
			});
		};

		// List CSS files and create the HTML list
		this.initFilesList = function(){
			
			var files = document.getElementsByTagName('link'), 
				html = '<ul id="sofresh_links">',
				baseUrl = location.protocol + '//' + location.host,
				i = 0;
			
			for (var a = 0, l = files.length; a < l; a++) {
				var elem = files[a], rel = elem.rel, filename = '', checked = '', li_class = '';
				if (typeof rel != 'string' || rel.length == 0 || rel == 'stylesheet') {
					var href = this.getHref(elem);
					if (href != null && this.isLocalHref(href)) {
						this.links.push({
							'elem' : elem,
							'href' : href,
							'last' : false
						});
						$sf(elem).data('sofresh-link', i);
						filename = href.split('/').pop();
						if (this.active_files !== null) {
							if ($sf.inArray(href, this.active_files) != -1) {
								checked  = 'checked="checked"';
								li_class = 'sofresh-active';
							} else {
								checked  = '';
								li_class = 'sofresh-inactive';
							}
						} else {
							checked = 'checked="checked"';
						}
						html += '<li title="' + href + '" class="' + li_class + '">'+
									'<label for="sofresh_link_' + i + '">'+
										'<input type="checkbox" name="sofresh_links_filters[]" id="sofresh_link_' + i + '" ' + checked + ' /> '+
										'<span class="sofresh-icon-wrapper"> '+
											'<img src="<?php get_inline_image("checkbox_checked_icon&16.png"); ?>" class="sofresh-icon sofresh-icon-checkbox-checked" />'+
											'<img src="<?php get_inline_image("checkbox_unchecked_icon&16.png"); ?>" class="sofresh-icon sofresh-icon-checkbox-unchecked" />'+
										'</span> '+
										filename +
									'</label>'+
									'<a href="' + href + '" title="' + href + '" target="_blank">'+
										'<img src="<?php get_inline_image("rnd_br_next_icon&16.png"); ?>" class="sofresh-icon sofresh-icon-br-next" />'+
									'</a>'+
								'</li>';
						i++;
					} else {
						if (console) console.warn("[SoFresh] A non-local CSS file will not be resfreshed: " + href);
					}
				}
			}
			html += '</ul>';
			$sf('#sofresh_content').append(html);
		};

		this.initEvents = function(){
			var $this = this;
			// - Update the array of CSS files to reload
			// - Define startup cookie
			$sf('#sofresh_links input:checkbox').on('change', function(){
				var inputs = $sf('#sofresh_links input');
				var checked_links = [];
				var $input;
				inputs.each(function(i, input){
					$input = $sf(input);
					if ($input.is(':checked')) {
						checked_links.push($this.links[i]);
						$input.parents('li').first().removeClass('sofresh-inactive').addClass('sofresh-active');
					} else {
						$input.parents('li').first().removeClass('sofresh-active').addClass('sofresh-inactive');
					}
				});
				$this.saveState();
				$this.reloadFile(checked_links);
			}).trigger('change');
			// Refresh on check
			$sf('#sofresh_links label').on('click', function(){
				$label = $sf(this);
				var i = $label.attr('for').replace(/sofresh_link_/i, '');
				$this.links[i].force_refresh = true;
			});
			// UI events
			$sf(window).on('resize.sofresh', function(){ $this.reposition() }).trigger('resize.sofresh');
			$sf('#sofresh_close').on('click', window.soFreshDestroy);
			$sf('#sofresh_content_toggler').on('click', function(){ return $this.toggleContent() });
			$sf('#sofresh_check_all').on('click', { links: this.links }, this.checkAll);
			$sf('#sofresh_uncheck_all').on('click', { links: this.links }, this.uncheckAll);
		};

		this.initHTML = function(){
			// CSS
			$sf('head').append('<style type="text/css" id="sofresh-style"><?php echo $css; ?></style>');
			// HTML
			$sf(document.body).append(
				'<div id="sofresh" class="sofresh-expanded" style="display:none">'+ 
					'<div>'+
						'<div id="sofresh_header">'+
							'<span id="sofresh_check"></span>'+
							'<span id="sofresh_title"><i></i>SoFresh!</span>'+
							'<span id="sofresh_content_toggler" title="Toggle expanded / collapsed view">'+
								'<img src="<?php get_inline_image("rnd_br_down_icon&16.png"); ?>" class="sofresh-icon sofresh-icon-br-down" />'+
							'</span>'+
						'</div>'+
						'<div id="sofresh_content_actions">'+
							'<a href="#" id="sofresh_check_all">check</a> / <a href="#" id="sofresh_uncheck_all">uncheck</a> all files'+
							'<span id="sofresh_close" title="Close SoFresh!"><img src="<?php get_inline_image("round_delete_icon&16.png"); ?>" class="sofresh-icon sofresh-round-delete" /></span>'+
						'</div>'+
						'<div id="sofresh_content"></div>'+
						'<div id="sofresh_footer">'+
							'<a href="http://sofresh.redpik.net/">SoFresh! <?php echo SOFRESH_VERSION; ?></a> by <a href="http://nicolas.sorosac.fr/">Nico</a>, <a href="http://www.redpik.net/">Ben</a> &amp; <a href="http://sylvain.gougouzian.fr/">GouZ</a>'+
						'</div>'+
					'</div>'+
					(this.getDoNotTrack() ? '' : '<img src="<?php echo $baseUrl.googleAnalyticsGetImageUrl(); ?>" style="display:none" />')+
				'</div>'
			);
			this.container = $sf('#sofresh');
		};

		this.initHTML();
		this.initState();
		this.initFilesList();
		this.initEvents();
		this.initDragAndDrop();
	};

	window.soFresh();

})();
