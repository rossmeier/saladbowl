enum Team {
    RED,
    BLUE
}

enum PlayerStatus {
    ACTIVE,
    PASSIVE,
    DISCONNECTED
}

type userID = number;
type UserType = {
    name: string,
    team: Team,
    id: userID,
    status: PlayerStatus,
    score: number,
}

type UserMapType = Map<userID, UserType>

function UsersList(props: { users: UserType[] }) {
    const items = props.users.map(user => <li key={user.id}><div>{user.name}</div></li>)
    return <div className="UsersList">
        <ul>{items}</ul>
    </div>
}

export {Team, PlayerStatus, UsersList};

export type {UserType, UserMapType}
