/*
 * Utilities
 */
( function( $, mw ) {

	mediaWiki.util = {

		/* Initialisation */
		'initialised' : false,
		'init' : function () {
			if ( this.initialised === false ) {
				this.initialised = true;

				// Any initialisation after the DOM is ready
				$( function() {

					// Shortcut
					var profile = $.client.profile();

					// Set tooltipAccessKeyPrefix

					// Opera on any platform
					if ( profile.name == 'opera' ) {
						mw.util.tooltipAccessKeyPrefix = 'shift-esc-';

					// Chrome on any platform
					} else if ( profile.name == 'chrome' ) {
						// Chrome on Mac or Chrome on other platform ?
						mw.util.tooltipAccessKeyPrefix = ( profile.platform == 'mac'
							? 'ctrl-option-' : 'alt-' );

					// Non-Windows Safari with webkit_version > 526
					} else if ( profile.platform !== 'win'
						&& profile.name == 'safari'
						&& profile.layoutVersion > 526 )
					{
						mw.util.tooltipAccessKeyPrefix = 'ctrl-alt-';

					// Safari/Konqueror on any platform, or any browser on Mac
					// (but not Safari on Windows)
					} else if ( !( profile.platform == 'win' && profile.name == 'safari' )
									&& ( profile.name == 'safari'
									|| profile.platform == 'mac'
									|| profile.name == 'konqueror' ) ) {
						mw.util.tooltipAccessKeyPrefix = 'ctrl-';

					// Firefox 2.x
					} else if ( profile.name == 'firefox' && profile.versionBase == '2' ) {
						mw.util.tooltipAccessKeyPrefix = 'alt-shift-';
					}

					// Enable CheckboxShiftClick
					$('input[type=checkbox]:not(.noshiftselect)').checkboxShiftClick();

					// Emulate placeholder if not supported by browser
					if ( !( 'placeholder' in document.createElement( 'input' ) ) ) {
						$('input[placeholder]').placeholder();
					}

					// Fill $content var
					if ( $('#bodyContent').length ) {
						mw.util.$content = $('#bodyContent');
					} else if ( $('#article').length ) {
						mw.util.$content = $('#article');
					} else {
						mw.util.$content = $('#content');
					}
				});

				return true;
			}
			return false;
		},

		/* Main body */

		/**
		 * Encode the string like PHP's rawurlencode
		 *
		 * @param str String to be encoded
		 */
		'rawurlencode' : function( str ) {
			str = (str + '').toString();
			return encodeURIComponent( str )
				.replace( /!/g, '%21' ).replace( /'/g, '%27' ).replace( /\(/g, '%28' )
				.replace( /\)/g, '%29' ).replace( /\*/g, '%2A' ).replace( /~/g, '%7E' );
		},

		/**
		 * Encode page titles for use in a URL
		 * We want / and : to be included as literal characters in our title URLs
		 * as they otherwise fatally break the title
		 *
		 * @param str String to be encoded
		 */
		'wikiUrlencode' : function( str ) {
			return this.rawurlencode( str )
				.replace( /%20/g, '_' ).replace( /%3A/g, ':' ).replace( /%2F/g, '/' );
		},

		/**
		 * Append a new style block to the head
		 *
		 * @param text String CSS to be appended
		 * @return the CSS stylesheet
		 */
		'addCSS' : function( text ) {
			var s = document.createElement( 'style' );
			s.type = 'text/css';
			s.rel = 'stylesheet';
			if ( s.styleSheet ) {
				s.styleSheet.cssText = text; // IE
			} else {
				s.appendChild( document.createTextNode( text + '' ) ); // Safari sometimes borks on null
			}
			document.getElementsByTagName("head")[0].appendChild( s );
			return s.sheet || s;
		},

		/**
		 * Get the full URL to a page name
		 *
		 * @param str Page name to link to
		 */
		'wikiGetlink' : function( str ) {
			return wgServer + wgArticlePath.replace( '$1', this.wikiUrlencode( str ) );
		},

		/**
		 * Grab the URL parameter value for the given parameter.
		 * Returns null if not found.
		 *
		 * @param param The parameter name
		 * @param url URL to search through (optional)
		 */
		'getParamValue' : function( param, url ) {
			url = url ? url : document.location.href;
			// Get last match, stop at hash
			var re = new RegExp( '[^#]*[&?]' + $.escapeRE( param ) + '=([^&#]*)' );
			var m = re.exec( url );
			if ( m && m.length > 1 ) {
				// Beware that decodeURIComponent is not required to understand '+'
				// by spec, as encodeURIComponent does not produce it.
				return decodeURIComponent( m[1].replace( /\+/g, '%20' ) );
			}
			return null;
		},

		// Access key prefix.
		// Will be re-defined based on browser/operating system detection in
		// mw.util.init().
		'tooltipAccessKeyPrefix' : 'alt-',

		// Regex to match accesskey tooltips
		'tooltipAccessKeyRegexp': /\[(ctrl-)?(alt-)?(shift-)?(esc-)?(.)\]$/,

		/**
		 * Add the appropriate prefix to the accesskey shown in the tooltip.
		 * If the nodeList parameter is given, only those nodes are updated;
		 * otherwise, all the nodes that will probably have accesskeys by
		 * default are updated.
		 *
		 * @param nodeList jQuery object, or array of elements
		 */
		'updateTooltipAccessKeys' : function( nodeList ) {
			var $nodes;
			if ( nodeList instanceof jQuery ) {
				$nodes = nodeList;
			} else if ( nodeList ) {
				$nodes = $(nodeList);
			} else {
				// Rather than scanning all links, just the elements that
				// contain the relevant links
				this.updateTooltipAccessKeys(
					$('#column-one a, #mw-head a, #mw-panel a, #p-logo a') );

				// these are rare enough that no such optimization is needed
				this.updateTooltipAccessKeys( $('input') );
				this.updateTooltipAccessKeys( $('label') );
				return;
			}

			$nodes.each( function ( i ) {
				var tip = $(this).attr( 'title' );
				if ( !!tip && mw.util.tooltipAccessKeyRegexp.exec( tip ) ) {
					tip = tip.replace( mw.util.tooltipAccessKeyRegexp,
						'[' + mw.util.tooltipAccessKeyPrefix + "$5]" );
					$(this).attr( 'title', tip );
				}
			});
		},

		// jQuery object that refers to the page-content element
		// Populated by init()
		'$content' : null,

		/**
		 * Add a link to a portlet menu on the page, such as:
		 *
		 * p-cactions (Content actions), p-personal (Personal tools),
		 * p-navigation (Navigation), p-tb (Toolbox)
		 *
		 * The first three paramters are required, others are optionals. Though
		 * providing an id and tooltip is recommended.
		 *
		 * By default the new link will be added to the end of the list. To
		 * add the link before a given existing item, pass the DOM node
		 * (document.getElementById('foobar')) or the jQuery-selector
		 * ('#foobar') of that item.
		 *
		 * @example mw.util.addPortletLink(
		 *	 'p-tb', 'http://mediawiki.org/',
		 *	 'MediaWiki.org', 't-mworg', 'Go to MediaWiki.org ', 'm', '#t-print'
		 * )
		 *
		 * @param portlet ID of the target portlet ('p-cactions' or 'p-personal' etc.)
		 * @param href Link URL
		 * @param text Link text (will be automatically converted to lower
		 *	 case by CSS for p-cactions in Monobook)
		 * @param id ID of the new item, should be unique and preferably have
		 *	 the appropriate prefix ( 'ca-', 'pt-', 'n-' or 't-' )
		 * @param tooltip Text to show when hovering over the link, without accesskey suffix
		 * @param accesskey Access key to activate this link (one character, try
		 *	 to avoid conflicts. Use $( '[accesskey=x' ).get() in the console to
		 *	 see if 'x' is already used.
		 * @param nextnode DOM node or jQuery-selector of the item that the new
		 *	 item should be added before, should be another item in the same
		 *	 list will be ignored if not the so
		 *
		 * @return The DOM node of the new item (a LI element, or A element for
		 *	 older skins) or null.
		 */
		'addPortletLink' : function( portlet, href, text, id, tooltip, accesskey, nextnode ) {

			// Check if there's atleast 3 arguments to prevent a TypeError
			if ( arguments.length < 3 ) {
				return null;
			}
			// Setup the anchor tag
			var $link = $( '<a></a>' ).attr( 'href', href ).text( text );
			if ( tooltip ) {
				$link.attr( 'title', tooltip );
			}

			// Some skins don't have any portlets
			// just add it to the bottom of their 'sidebar' element as a fallback
			switch ( skin ) {
			case 'standard' :
			case 'cologneblue' :
				$("#quickbar").append($link.after( '<br />' ));
				return $link.get(0);
			case 'nostalgia' :
				$("#searchform").before($link).before( ' &#124; ' );
				return $link.get(0);
			default : // Skins like chick, modern, monobook, myskin, simple, vector...

				// Select the specified portlet
				var $portlet = $('#' + portlet);
				if ( $portlet.length === 0 ) {
					return null;
				}
				// Select the first (most likely only) unordered list inside the portlet
				var $ul = $portlet.find( 'ul' ).eq( 0 );

				// If it didn't have an unordered list yet, create it
				if ($ul.length === 0) {
					// If there's no <div> inside, append it to the portlet directly
					if ($portlet.find( 'div' ).length === 0) {
						$portlet.append( '<ul></ul>' );
					} else {
						// otherwise if there's a div (such as div.body or div.pBody)
						// append the <ul> to last (most likely only) div
						$portlet.find( 'div' ).eq( -1 ).append( '<ul></ul>' );
					}
					// Select the created element
					$ul = $portlet.find( 'ul' ).eq( 0 );
				}
				// Just in case..
				if ( $ul.length === 0 ) {
					return null;
				}

				// Unhide portlet if it was hidden before
				$portlet.removeClass( 'emptyPortlet' );

				// Wrap the anchor tag in a <span> and create a list item for it
				// and back up the selector to the list item
				var $item = $link.wrap( '<li><span></span></li>' ).parent().parent();

				// Implement the properties passed to the function
				if ( id ) {
					$item.attr( 'id', id );
				}
				if ( accesskey ) {
					$link.attr( 'accesskey', accesskey );
					tooltip += ' [' + accesskey + ']';
				}
				if ( tooltip ) {
					$link.attr( 'title', tooltip );
				}
				if ( accesskey && tooltip ) {
					this.updateTooltipAccessKeys( $link );
				}

				// Append using DOM-element passing
				if ( nextnode && nextnode.parentNode == $ul.get( 0 ) ) {
					$(nextnode).before( $item );
				} else {
					// If the jQuery selector isn't found within the <ul>, just
					// append it at the end
					if ( $ul.find( nextnode ).length === 0 ) {
						$ul.append( $item );
					} else {
						// Append using jQuery CSS selector
						$ul.find( nextnode ).eq( 0 ).before( $item );
					}
				}

				return $item.get( 0 );
			}
		},
	
		/**
		 * Validate a string as representing a valid e-mail address
		 * according to HTML5 specification. Please note the specification
		 * does not validate a domain with one character.
		 *
		 * FIXME: should be moved to a JavaScript validation module.
		 */
		'validateEmail' : function( mailtxt ) {
			if( mailtxt === '' ) {
				return null;
			}
		
			/**
			 * HTML5 defines a string as valid e-mail address if it matches
			 * the ABNF:
			 *	1 * ( atext / "." ) "@" ldh-str 1*( "." ldh-str )
			 * With:
			 * - atext	: defined in RFC 5322 section 3.2.3
			 * - ldh-str : defined in RFC 1034 section 3.5
			 *
			 * (see STD 68 / RFC 5234 http://tools.ietf.org/html/std68):
			 */
		
			/**
			 * First, define the RFC 5322 'atext' which is pretty easy :
			 * atext = ALPHA / DIGIT / ; Printable US-ASCII
						 "!" / "#" /	 ; characters not including
						 "$" / "%" /	 ; specials. Used for atoms.
						 "&" / "'" /
						 "*" / "+" /
						 "-" / "/" /
						 "=" / "?" /
						 "^" / "_" /
						 "`" / "{" /
						 "|" / "}" /
						 "~"
			*/
			var	rfc5322_atext = "a-z0-9!#$%&'*+\\-/=?^_`{|}~",
		
			/**
			 * Next define the RFC 1034 'ldh-str'
			 *	<domain> ::= <subdomain> | " "
			 *	<subdomain> ::= <label> | <subdomain> "." <label>
			 *	<label> ::= <letter> [ [ <ldh-str> ] <let-dig> ]
			 *	<ldh-str> ::= <let-dig-hyp> | <let-dig-hyp> <ldh-str>
			 *	<let-dig-hyp> ::= <let-dig> | "-"
			 *	<let-dig> ::= <letter> | <digit>
			 */
				rfc1034_ldh_str = "a-z0-9\\-",
	
				HTML5_email_regexp = new RegExp(
					// start of string
					'^'
					+
					// User part which is liberal :p
					'[' + rfc5322_atext + '\\.]+'
					+
					// "at"
					'@'
					+
					// Domain first part
					'[' + rfc1034_ldh_str + ']+'
					+
					// Optional second part and following are separated by a dot
					'(?:\\.[' + rfc1034_ldh_str + ']+)*'
					+
					// End of string
					'$',
					// RegExp is case insensitive
					'i'
				);
			return (null !== mailtxt.match( HTML5_email_regexp ) );
		}

	};

	mediaWiki.util.init();

} )( jQuery, mediaWiki );