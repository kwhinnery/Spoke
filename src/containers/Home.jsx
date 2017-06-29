import React from 'react'
import loadData from './hoc/load-data'
import gql from 'graphql-tag'
import { StyleSheet, css } from 'aphrodite'
import wrapMutations from './hoc/wrap-mutations'
import theme from '../styles/theme'
import { withRouter } from 'react-router'

const styles = StyleSheet.create({
  container: {
    marginTop: '5vh',
    textAlign: 'center',
    color: theme.colors.lightGray
  },
  content: {
    ...theme.layouts.greenBox
  },
  bigHeader: {
    ...theme.text.header,
    fontSize: 40
  },
  header: {
    ...theme.text.header,
    marginBottom: 15,
    color: theme.colors.white
  },
  link: {
    ...theme.text.link
  }
})

class Home extends React.Component {
  state = {
    orgLessUser: false
  }

  componentWillMount() {
    const user = this.props.data.currentUser
    if (user) {
      if (user.adminOrganizations.length > 0) {
        this.props.router.push(`/admin/${user.adminOrganizations[0].id}`)
      } else if (user.texterOrganizations.length > 0) {
        this.props.router.push(`/app/${user.texterOrganizations[0].id}`)
      } else {
        this.setState({ orgLessUser: true })
      }
    }
  }
  renderContent() {
    if (this.state.orgLessUser) {
      return (
        <div>
          <div className={css(styles.header)}>
            You currently aren't part of any organization!
          </div>
          <div>
            If you got sent a link by somebody to start texting, ask that person to send you the link to join their organization. Then, come back here and start texting!
          </div>
        </div>
      )
    }
    return (
      <div>
        <div className={css(styles.header)}>
        Spoke is a new way to run campaigns using text messaging. Ask an administrator for an invitation.
        </div>
        <div>
          <a className={css(styles.link)} href='mailto:help@gearshift.co'>Get in touch if you'd like an invitation.</a>
        </div>
      </div>
    )
  }

  render() {
    return (
      <div className={css(styles.container)}>
        <div className={css(styles.bigHeader)}>
          Spoke
        </div>
        <div className={css(styles.content)}>
          {this.renderContent()}
        </div>
      </div>
    )
  }
}

const mapQueriesToProps = () => ({
  data: {
    query: gql` query getCurrentUser {
      currentUser {
        id
        adminOrganizations:organizations(role:"ADMIN") {
          id
        }
        texterOrganizations:organizations(role:"TEXTER") {
          id
        }
      }
    }`
  }
})


export default loadData(wrapMutations(withRouter(Home)), { mapQueriesToProps })
