import { mapFieldsToModel } from './lib/utils'
import { Campaign, JobRequest, r } from '../models'

export const schema = `
  input CampaignsFilter {
    isArchived: Boolean
  }

  type CampaignStats {
    sentMessagesCount: Int
    receivedMessagesCount: Int
  }

  type JobRequest {
    id: String
    jobType: String
    assigned: Boolean
    status: Int
  }

  type Campaign {
    id: ID
    organization: Organization
    title: String
    description: String
    dueBy: Date
    isStarted: Boolean
    isArchived: Boolean
    texters: [User]
    assignments: [Assignment]
    interactionSteps: [InteractionStep]
    contacts: [CampaignContact]
    contactsCount: Int
    hasUnassignedContacts: Boolean
    customFields: [String]
    cannedResponses(userId: String): [CannedResponse]
    stats: CampaignStats,
    pendingJobs: [JobRequest]
  }
`

export const resolvers = {
  JobRequest: {
    ...mapFieldsToModel([
      'id',
      'assigned',
      'status',
      'jobType'
    ], JobRequest)
  },
  CampaignStats: {
    sentMessagesCount: async (campaign) => (
      r.table('assignment')
        .getAll(campaign.id, { index: 'campaign_id' })
        .eqJoin('id', r.table('message'), { index: 'assignment_id' })
        .filter({ is_from_contact: false })
        .count()
        // TODO: NEEDS TESTING 
        // this is a change to avoid very weird map(...).sum() pattern
        // that will work better with RDBMs
        // main question is will/should filter work, or do we need to specify,
        // e.g. 'right_is_from_contact': false, or something
        // .map((assignment) => (
        //   r.table('message')
        //     .getAll(assignment('id'), { index: 'assignment_id' })
        //     .filter({ is_from_contact: false })
        //     .count()
        // )).sum()
    ),
    receivedMessagesCount: async (campaign) => (
      r.table('assignment')
        .getAll(campaign.id, { index: 'campaign_id' })
        //TODO: NEEDSTESTING -- see above setMessagesCount()
        .eqJoin('id', r.table('message'), { index: 'assignment_id' })
        .filter({ is_from_contact: true })
        .count()
    )
  },
  Campaign: {
    ...mapFieldsToModel([
      'id',
      'title',
      'description',
      'dueBy',
      'isStarted',
      'isArchived'
    ], Campaign),
    organization: async (campaign, _, { loaders }) => (
      loaders.organization.load(campaign.organization_id)
    ),
    pendingJobs: async (campaign) => r.table('job_request')
      .filter({ campaign_id: campaign.id }),
    texters: async (campaign) => (
      r.table('assignment')
        .getAll(campaign.id, { index: 'campaign_id' })
        .eqJoin('user_id', r.table('user'))('right')
    ),
    assignments: async (campaign) => (
      r.table('assignment')
        .getAll(campaign.id, { index: 'campaign_id' })
    ),
    interactionSteps: async (campaign) => (
      r.table('interaction_step')
        .getAll(campaign.id, { index: 'campaign_id' })
    ),
    cannedResponses: async (campaign, { userId }) => {
      let responses = r.table('canned_response')
        .getAll(campaign.id, { index: 'campaign_id' })
      if (userId) {
        responses = responses.filter({
          user_id: userId
        })
      } else {
        responses = responses.filter({
          user_id: ''
        })
      }
      return responses
    },
    contacts: async (campaign) => (
      r.table('campaign_contact')
        .getAll(campaign.id, { index: 'campaign_id' })
    ),
    contactsCount: async (campaign) => (
      r.table('campaign_contact')
        .getAll(campaign.id, { index: 'campaign_id' })
        .count()
    ),
    hasUnassignedContacts: async (campaign) => {
      const hasContacts = await r.table('campaign_contact')
        .getAll([campaign.id, ''], { index: 'campaign_assignment' })
        .limit(1)(0)
        .default(null)
      return !!hasContacts
    },
    customFields: async (campaign) => {
      const campaignContacts = await r.table('campaign_contact')
        .getAll(campaign.id, { index: 'campaign_id' })
        .limit(1)
      if (campaignContacts.length > 0) {
        return Object.keys(JSON.parse(campaignContacts[0].custom_fields))
      }
      return []
    },
    stats: async (campaign) => campaign
  }
}
