@include('include.header')



	 <section class="section">
		 <div class="container">
<h1 class="title">Scoreboard</h1>



<table class="table is-fullwidth">
	<thead>
		<tr>
			<th>#</th>
			<th>Name</th>
			<th>Score</th>
		</tr>
	</thead>
	<tbody>
	
	
		   @foreach ($users as $key => $user)
		   <tr>
				<td>{{$users->firstItem() + $key}}</td>
				<td><a href="/users/{{$user->user->id}}">{{$user->user->name}}</a></td>
				<td>{{$user->total_score}}</td>
		   </tr>
    @endforeach
	</tbody>
</table>
		 
{{$users->onEachSide(5)->links()}}

    </div>

    </section>



@include('include.footer')