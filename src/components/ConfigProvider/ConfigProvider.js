import React from 'react';
import PropTypes from 'prop-types';

export default class ConfigProvider extends React.Component {

  static childContextTypes = {
    isWebView: PropTypes.bool,
    insets: PropTypes.shape({
      top: PropTypes.number,
      right: PropTypes.number,
      bottom: PropTypes.number,
      left: PropTypes.number
    })
  };

  static propTypes = {
    isWebView: PropTypes.bool,
    insets: PropTypes.shape({
      top: PropTypes.number,
      right: PropTypes.number,
      bottom: PropTypes.number,
      left: PropTypes.number
    }),
    children: PropTypes.node
  };

  getChildContext () {
    return {
      isWebView: this.props.isWebView || true,
      insets: this.props.insets || null
    };
  }

  render () {
    return this.props.children;
  }
}
