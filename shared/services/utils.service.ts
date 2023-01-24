import { Request } from '@pepperi-addons/debug-server';

export class UtilsService {
    private _request: Request;

    constructor(request: Request) {
        this._request = request;
    }

    buildFinOptionsQuery() {
        return {
            ...(this._request.query.fields && {fields: this._request.query.fields.split(',')}),
			...(this._request.query.where && {where: this._request.query.where}),
			...(this._request.query.order_by && {order_by: this._request.query.order_by}),
			...(this._request.query.page && {page: this._request.query.page}),
			...(this._request.query.page_size && {page_size: this._request.query.page_size}),
			...(this._request.query.include_deleted && {include_deleted: this._request.query.include_deleted})
        }
    }
}