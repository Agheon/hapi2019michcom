export default {
    method: ['GET'],
    path: '/test',
    options: {
        handler: (request, h) => {
            
            return h.view('test')
        }
    }
}
