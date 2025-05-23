import autocomplete      from '../../autocompleter/autocomplete.es.js'
import { PreventSubmit } from '../../autocompleter/autocomplete.es.js'
import { loadCss }       from '../asset-loader/asset-loader.js'

type Item = {
	label: string,
	value: number
}

export function autoCompleter(input: HTMLInputElement)
{
	loadCss('/node_modules/autocompleter/autocomplete.css')
	loadCss('/node_modules/@itrocks/autocompleter/autocompleter.css')

	autocomplete({
		input,

		fetch: (text, update) =>
		{
			const dataFetch = input.dataset.fetch ?? input.closest<HTMLElement>('[data-fetch]')?.dataset.fetch
			const requestInit: RequestInit = { headers: { Accept: 'application/json' } }
			const summaryRoute = dataFetch + '?startsWith=' + text
			fetch(summaryRoute, requestInit).then(response => response.text()).then(json => {
				const summary: [string, string][] = JSON.parse(json)
				const startsWith  = input.value.toLowerCase()
				const suggestions = summary.map(([id, summary]) => ({ label: summary, value: +id }))
					.filter(item => item.label.toLowerCase().startsWith(startsWith))
				update(suggestions)
			})
		},

		minLength: 0,

		onSelect: (item: Item, input: HTMLInputElement | HTMLTextAreaElement) =>
		{
			// value
			if (input.nextElementSibling instanceof HTMLInputElement) {
				input.nextElementSibling.value = '' + item.value
			}
			else {
				let dotPosition = input.id.lastIndexOf('.')
				const name      = (dotPosition < 0) ? input.id : input.id.slice(0, dotPosition)
				input.id        = input.name = name + '.' + item.value
			}
			// label
			input.value = item.label
			input.dispatchEvent(new Event('input', { cancelable: true }))
		},

		preventSubmit: PreventSubmit.OnSelect
	})

	input.addEventListener('change', () => {
		if (input.value.length) return

		if (input.nextElementSibling instanceof HTMLInputElement) {
			input.nextElementSibling.value = ''
			return
		}

		let dotPosition = input.id.lastIndexOf('.')
		const name = (dotPosition < 0) ? input.id : input.id.slice(0, dotPosition)
		input.id = input.name = name

		const parent = input.parentElement
		const item   = (parent instanceof HTMLLIElement) ? parent : input
		if (!item.parentElement || (item === item.parentElement.lastElementChild)) return
		item.remove()
	})

	if (!input.dataset.fetch) {
		const parent = input.parentElement
		const item   = (parent instanceof HTMLLIElement) ? parent : input

		input.addEventListener('input', () => {
			if (item.nextElementSibling || !input.value.length || !item.parentElement) return

			const newItem  = item.cloneNode(true) as HTMLInputElement | HTMLLIElement
			const newInput = (newItem instanceof HTMLLIElement) ? newItem.getElementsByTagName('input')[0] : newItem
			newInput.value = ''
			item.parentElement.append(newItem)
			setTimeout(() => { newInput.dispatchEvent(new Event('input', { cancelable: true })) })
		})
	}
}

export function multiple(list: HTMLUListElement)
{
	list.querySelectorAll<HTMLInputElement>('input').forEach(autoCompleter)
}
