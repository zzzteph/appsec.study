@if($entries->count()!=0) 
	<h3 class="mb-2 is-size-5  has-text-weight-bold has-text-black">Top 5</h3>
	<table class="table is-fullwidth">
		<thead>
			<tr>
				<th>#</th>
				<th>Name</th>
				<th>Score</th>
			</tr>
		</thead>
		<tbody>
		
		
			   @foreach ($entries as $entry)
			   <tr>
					<td>{{($entries->firstItem()-1)+$loop->iteration}}</td>
					<td><a href="/users/{{$entry->user->id}}">{{$entry->user->name}}</a></td>
					<td>{{$entry->score}}</td>
			   </tr>
		@endforeach
		</tbody>
	</table>
			 
			 @if($paginate==TRUE)
	{{$entries->onEachSide(5)->links()}}
	@endif
@endif