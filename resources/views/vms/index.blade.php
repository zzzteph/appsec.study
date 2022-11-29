@include('include.header')



	 <section class="section">
		 <div class="container">
		 

<form method="POST" action="{{route('create-vms')}}">
@csrf
<div class="field is-grouped">


  <p class="control is-expanded">
    <input class="input" name="name" type="text" placeholder="VM Name">
  </p>
  

    <p class="control is-expanded">
    <input class="input" name="image" type="text" placeholder="Cloud Image">
  </p>
  <p class="control">
    <button class="button is-success">
      Create
    </a>
  </p>
</div>

</form>



<table class="table is-fullwidth">
	<thead>
		<tr>
		   
			<th>VM name</th>
			<th>Cloud template</th>
			<th>Update</th>
			<th>Delete</th>
		</tr>
	</thead>
	<tbody>
	
	
		   @foreach ($vms as $vm)
		   <tr>
		   
		   <form method="POST" action="{{route('update-vms',['id' => $vm->id])}}">
		   					@csrf
					 @method('PUT')

		
		
				<td>
				
				<input class="input" name="name" type="text"  name="name" value="{{ $vm->name }}">
				
				</td>
				<td>
				
					<input class="input" name="image" type="text" name="cloud_id"  value="{{ $vm->image }}">
				</td>
				
				
				<td>
					

					 <button class="button is-success">Update</button>
					
				</td>
				 </form>
				
				<td>
									<form method="POST" action="{{route('delete-vms',['id' => $vm->id])}}">
					@csrf
					 @method('DELETE')
				
					 <button class="button is-danger">Delete</button>
					 </form>
				
				
				</td>
		   </tr>
    @endforeach
	</tbody>
</table>
		 
{{$vms->onEachSide(5)->links()}}

    </div>

    </section>



@include('include.footer')