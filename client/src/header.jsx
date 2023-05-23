import Avatar from "./AvatarHeader";

export default function ContactView({id,username,onClick,selected,online}) {
    return (
      <div className="border-b border-gray-100 flex items-center gap-2 cursor-pointer ">
        <div className="flex gap-2 py-2 pl-4 items-center">
          <Avatar online={online} username={username} userId={id} />
          <div className="flex flex-col">
          <span className="text-gray-800 font-bold text-base">{username}</span>
          <span className="text-gray-400 font-light text-xs">(CID: {id})</span>
          </div>
         
        </div>
      </div>
    );
  }