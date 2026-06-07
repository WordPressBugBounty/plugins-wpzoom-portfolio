<?php
/**
 * WPZOOM Portfolio - Elementor integration loader.
 *
 * Registers a custom Elementor category and the plugin's Elementor widgets.
 * Everything here is hooked onto Elementor-specific actions, so it stays inert
 * (and never references missing Elementor classes) when Elementor is not active.
 *
 * @since   1.4.27
 * @package WPZOOM_Portfolio
 */

// Exit if accessed directly.
defined( 'ABSPATH' ) || exit;

if ( ! class_exists( 'WPZOOM_Portfolio_Elementor' ) ) {

	/**
	 * Class WPZOOM_Portfolio_Elementor
	 *
	 * @since 1.4.27
	 */
	class WPZOOM_Portfolio_Elementor {

		/**
		 * This class instance.
		 *
		 * @var WPZOOM_Portfolio_Elementor
		 * @since 1.4.27
		 */
		private static $instance;

		/**
		 * Provides singleton instance.
		 *
		 * @since 1.4.27
		 * @return self instance
		 */
		public static function instance() {
			if ( null === self::$instance ) {
				self::$instance = new self();
			}

			return self::$instance;
		}

		/**
		 * Constructor.
		 *
		 * These hooks only ever fire when Elementor is loaded, so no extra
		 * guard is required to keep the integration dormant otherwise.
		 *
		 * @since 1.4.27
		 */
		public function __construct() {
			add_action( 'elementor/elements/categories_registered', array( $this, 'add_widget_category' ) );
			add_action( 'elementor/widgets/register', array( $this, 'register_widgets' ) );
			add_action( 'elementor/editor/before_enqueue_scripts', array( $this, 'enqueue_editor_styles' ) );
		}

		/**
		 * Add the "WPZOOM Portfolio" category to the Elementor panel.
		 *
		 * @since 1.4.27
		 * @param \Elementor\Elements_Manager $elements_manager Elementor elements manager.
		 * @return void
		 */
		public function add_widget_category( $elements_manager ) {
			$elements_manager->add_category(
				'wpzoom-portfolio',
				array(
					'title' => esc_html__( 'WPZOOM Portfolio', 'wpzoom-portfolio' ),
					'icon'  => 'fa fa-plug',
				)
			);
		}

		/**
		 * Include and register the plugin's Elementor widgets.
		 *
		 * @since 1.4.27
		 * @param \Elementor\Widgets_Manager $widgets_manager Elementor widgets manager.
		 * @return void
		 */
		public function register_widgets( $widgets_manager ) {
			require_once __DIR__ . '/widgets/class-wpzoom-portfolio-layout-widget.php';

			$widgets_manager->register( new WPZOOM_Portfolio_Layout_Widget() );
		}

		/**
		 * Enqueue editor-only styles.
		 *
		 * Floats the "WPZOOM Portfolio" category to the top of the Elementor
		 * widget panel (via flex ordering), matching the behaviour of the
		 * WPZOOM Forms plugin.
		 *
		 * @since 1.4.27
		 * @return void
		 */
		public function enqueue_editor_styles() {
			wp_enqueue_style(
				'wpzoom-portfolio-elementor-editor',
				WPZOOM_PORTFOLIO_URL . 'classes/elementor/assets/editor.css',
				array(),
				WPZOOM_PORTFOLIO_VERSION
			);
		}
	}

	WPZOOM_Portfolio_Elementor::instance();
}
