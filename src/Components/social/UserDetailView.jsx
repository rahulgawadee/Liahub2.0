import ProfileView from './ProfileView'

export default function UserDetailView(props){
  // Delegate to reusable ProfileView which handles masking/back button/etc.
  return <ProfileView {...props} />
}
