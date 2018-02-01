import React, { Component } from 'react'
import { View, StyleSheet, Animated, Platform } from 'react-native'
import PropTypes from 'prop-types'

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f0ad4e',
    flexDirection: 'column',
    opacity: 0.8,
    padding: 0
  },
  messageBlock: {
    flex: 1,
    overflow: 'hidden'
  },
  messageInline: {
    color: 'white',
    fontWeight: 'normal',
    paddingLeft: 15,
    paddingRight: 15,
    paddingTop: 0,
    paddingBottom: 0,
    marginTop: 0,
    marginBottom: 0
  }
})

export default class DropdownAlert extends Component {
  static propTypes = {
    height: PropTypes.number,
    pauseInterval: PropTypes.number,
    fontLineRate: PropTypes.number,
    textStyle: PropTypes.object,
    containerStyle: PropTypes.object
  }

  static defaultProps = {
    height: 20,
    pauseInterval: 2,
    fontLineRate: 0.7,
    textStyle: {},
    containerStyle: {}
  }

  constructor(props) {
    super(props)
    this.messageQueue = []
  }

  state = {
    messageOffset: new Animated.Value(0),
    messageYPosition: new Animated.Value(0),
    messageHeight: new Animated.Value(0),
    message: '',
    textLineNumber: 0,
    actualHeight: 0
  }

  _handleAnimationFinished = status => {
    const { messageOffset, textLineNumber } = this.state
    status.finished &&
    messageOffset._value === textLineNumber &&
    this.messageQueue.shift() &&
    this.messageQueue.length &&
    setTimeout(() => this._startAlert(this.messageQueue[0]), 1000)
  }

  _calculateTextLineNumber = textHeight => {
    const { height } = this.props
    return Platform.OS === 'ios' ? Math.floor(textHeight / height) : Math.ceil(textHeight / height)
  }

  _startAlert = message => {
    this.setState({ message }, () => {
      this.state.messageOffset.setValue(0)
      this.state.messageYPosition.setValue(0)
      this.state.messageHeight.setValue(0)
      this.state.messageOffset.stopAnimation()
      this.state.messageYPosition.stopAnimation()
      this._startAnimation()
    })
  }

  _startRolling = status => {
    if (!status.finished) return
    const { textLineNumber, actualHeight } = this.state
    const { pauseInterval } = this.props
    const animates = []
    animates.push(Animated.spring(this.state.messageHeight, {
      toValue: this.props.height
    }))
    for (let i = 1; i <= textLineNumber; i += 1) {
      animates.push(Animated.timing(this.state.messageOffset, {
        toValue: i,
        delay: 1000 * pauseInterval
      }))
    }
    animates.push(Animated.spring(this.state.messageHeight, {
      toValue: 0
    }))
    Animated.parallel(
      [
        Animated.sequence(animates),
        Animated.timing(this.state.messageYPosition, {
          toValue: this.state.messageOffset.interpolate({
            inputRange: [0, this.state.textLineNumber],
            outputRange: [0, -this.state.textLineNumber * actualHeight]
          })
        })
      ],
      { stopTogether: false }
    ).start(this._handleAnimationFinished)
  }

  _startAnimation = () => {
    Animated.timing(this.state.messageHeight, {
      toValue: this.props.height
    }).start(this._startRolling)
  }

  alertMessage = message => {
    !this.messageQueue.length && this._startAlert(message)
    this.messageQueue.push(message)
  }

  render() {
    const {
      height, containerStyle, textStyle, fontLineRate
    } = this.props
    return (
      <View style={{ height }}>
        <Animated.View
          style={[styles.container, { ...containerStyle }, { height: this.state.messageHeight }]}
        >
          <View style={styles.messageBlock}>
            <Animated.Text
              style={[
                styles.messageInline,
                { ...textStyle },
                { fontSize: height * fontLineRate, lineHeight: height },
                { transform: [{ translateY: this.state.messageYPosition }] }
              ]}
              onLayout={({ nativeEvent }) => {
                const lineNumber = this._calculateTextLineNumber(nativeEvent.layout.height)
                this.setState({
                  actualHeight: nativeEvent.layout.height / lineNumber,
                  textLineNumber: lineNumber
                })
              }}
            >
              {this.state.message}
            </Animated.Text>
          </View>
        </Animated.View>
      </View>
    )
  }
}

