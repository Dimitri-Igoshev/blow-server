export const PREMIUM_ID = "6831be446c59cd4bad808bb5";
export const TOP_ID = "6830b9a752bb4caefa0418a8";
export const MAILING_ID = "6831854519e3572edace86b7";
export const RAISE_ID = "6830b4d752bb4caefa041497";
export const CHAT_DELETE_ID = "6831857219e3572edace86ba";

export const checkIsActive = (expiredAt: Date) => {
	if (!expiredAt) return false;

	const currentDate = new Date();

	return currentDate.getTime() < new Date(expiredAt)?.getTime();
};

export const isPremium = (user: any) => {
	if (!user) return false;
	const premium = user.services.find(
		(service: any) => service._id === PREMIUM_ID
	);

	if (!premium) return false;

	return checkIsActive(premium?.expiredAt);
};

export const isTop = (user: any) => {
	if (!user) return false;

	// if (user.sex === "male") return false;

	const top = user?.services?.find((service: any) => service?._id === TOP_ID);

	if (!top) return false;

	return checkIsActive(top?.expiredAt);
};

export const isActive = (user: any) => {
	if (!user) return false;

	return user.status === "active";
};

export const canChatDelete = (user: any) => {
	if (!user) return false;
	const canDelete = user.services.find(
		(service: any) => service._id === CHAT_DELETE_ID
	);

	if (!canDelete) return false;

	return canDelete?.quantity > 0;
};
