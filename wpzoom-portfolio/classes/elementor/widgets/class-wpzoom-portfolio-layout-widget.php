<?php
/**
 * WPZOOM Portfolio Layout - Elementor widget.
 *
 * Lets the user pick a saved "Portfolio Layout" (the `portfolio_layout` custom
 * post type) and render it anywhere via Elementor. The actual markup is produced
 * by the same code path as the Gutenberg "Portfolio Layouts" block / the
 * `[wpzoom_portfolio_layout]` shortcode, so output stays consistent everywhere.
 *
 * @since   1.4.27
 * @package WPZOOM_Portfolio
 */

use Elementor\Widget_Base;
use Elementor\Controls_Manager;

// Exit if accessed directly.
defined( 'ABSPATH' ) || exit;

/**
 * Class WPZOOM_Portfolio_Layout_Widget
 *
 * @since 1.4.27
 */
class WPZOOM_Portfolio_Layout_Widget extends Widget_Base {

	/**
	 * Widget name (machine slug).
	 *
	 * @since 1.4.27
	 * @return string
	 */
	public function get_name() {
		return 'wpzoom-portfolio-layout';
	}

	/**
	 * Widget title shown in the panel.
	 *
	 * @since 1.4.27
	 * @return string
	 */
	public function get_title() {
		return esc_html__( 'Portfolio Layout', 'wpzoom-portfolio' );
	}

	/**
	 * Widget icon.
	 *
	 * @since 1.4.27
	 * @return string
	 */
	public function get_icon() {
		return 'eicon-gallery-grid';
	}

	/**
	 * Widget categories.
	 *
	 * @since 1.4.27
	 * @return array
	 */
	public function get_categories() {
		return array( 'wpzoom-portfolio' );
	}

	/**
	 * Search keywords for the panel.
	 *
	 * @since 1.4.27
	 * @return array
	 */
	public function get_keywords() {
		return array( 'portfolio', 'wpzoom', 'layout', 'gallery', 'grid', 'projects' );
	}

	/**
	 * Style dependencies.
	 *
	 * Declared here so Elementor loads them in the editor preview too; on the
	 * frontend the portfolio block style is also auto-enqueued by render_block().
	 * Loaded only when the widget is actually present on the page.
	 *
	 * @since 1.4.27
	 * @return string[]
	 */
	public function get_style_depends() {
		return array( 'wpzoom-blocks-css-style-portfolio' );
	}

	/**
	 * Script dependencies.
	 *
	 * @since 1.4.27
	 * @return string[]
	 */
	public function get_script_depends() {
		return array( 'jquery', 'masonry', 'imagesloaded' );
	}

	/**
	 * Get the list of saved Portfolio Layouts for the select control.
	 *
	 * @since 1.4.27
	 * @return array Map of post ID => post title.
	 */
	protected function get_portfolio_layouts() {
		$options = array();

		$layouts = get_posts(
			array(
				'post_type'        => 'portfolio_layout',
				'post_status'      => 'publish',
				'numberposts'      => -1,
				'orderby'          => 'title',
				'order'            => 'ASC',
				'suppress_filters' => false,
			)
		);

		foreach ( $layouts as $layout ) {
			$title             = '' !== trim( $layout->post_title ) ? $layout->post_title : sprintf( /* translators: %d: layout ID. */ esc_html__( '(no title) #%d', 'wpzoom-portfolio' ), $layout->ID );
			$options[ $layout->ID ] = $title;
		}

		return $options;
	}

	/**
	 * Register the widget controls.
	 *
	 * @since 1.4.27
	 * @return void
	 */
	protected function register_controls() {
		$this->start_controls_section(
			'section_content',
			array(
				'label' => esc_html__( 'Portfolio Layout', 'wpzoom-portfolio' ),
				'tab'   => Controls_Manager::TAB_CONTENT,
			)
		);

		$layouts = $this->get_portfolio_layouts();

		if ( empty( $layouts ) ) {
			$this->add_control(
				'no_layouts_notice',
				array(
					'type'            => Controls_Manager::RAW_HTML,
					'raw'             => sprintf(
						/* translators: 1: opening anchor tag, 2: closing anchor tag. */
						esc_html__( 'No portfolio layouts found yet. %1$sCreate your first layout%2$s, then come back and select it here.', 'wpzoom-portfolio' ),
						'<a href="' . esc_url( admin_url( 'post-new.php?post_type=portfolio_layout' ) ) . '" target="_blank">',
						'</a>'
					),
					'content_classes' => 'elementor-panel-alert elementor-panel-alert-info',
				)
			);
		} else {
			$this->add_control(
				'layout_id',
				array(
					'label'       => esc_html__( 'Select Layout', 'wpzoom-portfolio' ),
					'type'        => Controls_Manager::SELECT2,
					'options'     => $layouts,
					'default'     => '',
					'label_block' => true,
					'description' => esc_html__( 'Choose a saved Portfolio Layout to display.', 'wpzoom-portfolio' ),
				)
			);

			$this->add_control(
				'manage_layouts_link',
				array(
					'type'            => Controls_Manager::RAW_HTML,
					'raw'             => sprintf(
						/* translators: 1: opening "manage" anchor tag, 2: closing anchor, 3: opening "add new" anchor tag, 4: closing anchor. */
						esc_html__( '%1$sManage Portfolio Layouts%2$s or %3$sadd a new one%4$s.', 'wpzoom-portfolio' ),
						'<a href="' . esc_url( admin_url( 'edit.php?post_type=portfolio_layout' ) ) . '" target="_blank">',
						'</a>',
						'<a href="' . esc_url( admin_url( 'post-new.php?post_type=portfolio_layout' ) ) . '" target="_blank">',
						'</a>'
					),
					'content_classes' => 'elementor-descriptor',
				)
			);
		}

		$this->end_controls_section();
	}

	/**
	 * Render the widget output on the frontend (and in the editor preview).
	 *
	 * @since 1.4.27
	 * @return void
	 */
	protected function render() {
		$settings  = $this->get_settings_for_display();
		$layout_id = ! empty( $settings['layout_id'] ) ? absint( $settings['layout_id'] ) : 0;

		if ( ! $layout_id ) {
			if ( $this->is_elementor_editor() ) {
				printf(
					'<div class="wpzoom-portfolio-layout-placeholder elementor-alert elementor-alert-info">%s</div>',
					esc_html__( 'Please select a Portfolio Layout from the panel on the left.', 'wpzoom-portfolio' )
				);
			}

			return;
		}

		// The plugin only enqueues its frontend script (category filtering,
		// masonry layout and AJAX "Load More") when it detects a portfolio
		// block/shortcode in the post content. On an Elementor page the layout
		// lives in _elementor_data and the shortcode is generated here at render
		// time, so that detection never fires — force the assets to load.
		if ( class_exists( 'WPZOOM_Portfolio_Assets_Manager' ) ) {
			WPZOOM_Portfolio_Assets_Manager::instance()->enqueue_portfolio_assets();
		}

		// Some themes (e.g. Inspiro Premium) hook the portfolio block's
		// `wpzoom_portfolio_block_item_media` filter to inject a hover-video
		// layer. That layer relies on CSS/JS that only loads on the frontend, so
		// inside the Elementor editor the injected <video> renders its poster as
		// a duplicate of the thumbnail. A static editor preview can't show hover
		// anyway, so suppress the injected media while editing.
		$suppress_hover_media = $this->is_elementor_editor();
		if ( $suppress_hover_media ) {
			add_filter( 'wpzoom_portfolio_block_item_media', '__return_empty_string', PHP_INT_MAX );
		}

		// Render through the existing shortcode so output and asset enqueuing
		// match the Gutenberg "Portfolio Layouts" block exactly. The portfolio
		// block style is auto-enqueued by render_block() inside the shortcode.
		$html = do_shortcode( sprintf( '[wpzoom_portfolio_layout id="%d"]', $layout_id ) );

		if ( $suppress_hover_media ) {
			remove_filter( 'wpzoom_portfolio_block_item_media', '__return_empty_string', PHP_INT_MAX );
		}

		// Elementor's global Image Lightbox auto-opens any link to an image file
		// inside Elementor content. The portfolio already uses its own Magnific
		// Popup lightbox, so without this both fire and the visitor sees two
		// stacked lightboxes. Opt the plugin's image links out of Elementor's
		// lightbox; scoped to this widget so non-Elementor output is unaffected.
		$html = str_replace( 'class="mfp-image', 'data-elementor-open-lightbox="no" class="mfp-image', $html );

		// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Rendered, trusted block content from do_shortcode().
		echo $html;
	}

	/**
	 * Whether the widget is currently being rendered inside the Elementor
	 * editor (the editor itself, its AJAX element re-renders, or the preview
	 * iframe). Used to skip behaviour that only makes sense on the frontend.
	 *
	 * @since 1.4.27
	 * @return bool
	 */
	protected function is_elementor_editor() {
		if ( ! class_exists( '\Elementor\Plugin' ) ) {
			return false;
		}

		$plugin = \Elementor\Plugin::$instance;

		if ( isset( $plugin->editor ) && $plugin->editor->is_edit_mode() ) {
			return true;
		}

		if ( isset( $plugin->preview ) && method_exists( $plugin->preview, 'is_preview_mode' ) && $plugin->preview->is_preview_mode() ) {
			return true;
		}

		return false;
	}
}
